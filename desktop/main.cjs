'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL, fileURLToPath } = require('node:url');
const MAX_BYTES = 1024 * 1024;
const APP_HTML = path.join(__dirname, 'app', 'embedded-beam.html');
const APP_URL = pathToFileURL(APP_HTML).href;
const files = new Map();
let windowRef, ready = false, pending = [], writes = 0;
const fileFromArgs = argv => argv.find(value => typeof value === 'string' && /\.epd$/i.test(value) && path.isAbsolute(value));
const recordFile = filePath => {
  const record = { token: crypto.randomUUID(), name: path.basename(filePath) };
  files.set(record.token, filePath);
  return record;
};
function senderAllowed(event) {
  if (!windowRef || event.sender !== windowRef.webContents || !event.senderFrame || event.senderFrame.url !== APP_URL) throw new Error('File access is restricted to the application.');
}
function chosenFile(token) {
  const filePath = typeof token === 'string' && files.get(token);
  if (!filePath) throw new Error('Choose a project file first.');
  return filePath;
}
function safeName(value) {
  let name = String(value || 'Embedded-Plate.epd').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/, '').slice(0,120);
  if (!/\.epd$/i.test(name)) name += '.epd';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(name)) name = 'Project-' + name;
  return name;
}
async function readSelected(token) {
  const filePath = chosenFile(token), stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Project files must be smaller than 1 MB.');
  return { text: await fs.readFile(filePath, 'utf8'), name: path.basename(filePath) };
}
async function deliverProject(filePath) {
  if (!filePath) return;
  if (!ready) { pending.push(filePath); return; }
  try {
    if (path.extname(filePath).toLowerCase() !== '.epd') throw new Error('Select an .epd project.');
    const record = recordFile(filePath);
    await readSelected(record.token);
    windowRef.webContents.send('desktop:project', record);
  } catch (error) { dialog.showErrorBox('Project not opened', error.message); }
}
function command(name) { if (windowRef && ready) windowRef.webContents.send('desktop:command', name); }
async function exportPDF() {
  if (!windowRef || !ready) return;
  if (!await windowRef.webContents.executeJavaScript('Boolean(current)')) { await dialog.showMessageBox(windowRef, { type: 'info', message: 'Correct invalid inputs before exporting the report.' }); return; }
  const result = await dialog.showSaveDialog(windowRef, { title: 'Export calculation report', defaultPath: 'Connection-Design-Report.pdf', filters: [{ name: 'PDF document', extensions: ['pdf'] }] });
  if (result.canceled) return;
  try {
    const bytes = await windowRef.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
    await fs.writeFile(result.filePath, bytes);
  } catch (error) { dialog.showErrorBox('PDF not exported', error.message); }
}
function installMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [
      { label: 'New Project', accelerator: 'CmdOrCtrl+N', click: () => command('new') },
      { label: 'Open Project…', accelerator: 'CmdOrCtrl+O', click: () => command('open') },
      { type: 'separator' },
      { label: 'Save Project', accelerator: 'CmdOrCtrl+S', click: () => command('save') },
      { label: 'Save Project As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => command('saveAs') },
      { label: 'Export Input JSON…', click: () => command('export') },
      { label: 'Export Report PDF…', click: exportPDF },
      { label: 'Print…', accelerator: 'CmdOrCtrl+P', click: () => command('print') },
      { type: 'separator' }, { role: 'quit' }
    ] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'Design', submenu: [{ label: 'Run Checks', accelerator: 'F9', click: () => command('check') }, { label: 'Calculation Report', click: () => command('report') }] },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [{ label: 'About Connection Design', click: () => dialog.showMessageBox(windowRef, { type: 'info', title: 'Connection Design', message: 'Connection Design ' + app.getVersion(), detail: 'Offline embedded head plate checks. Results apply only to the models and assumptions stated in the calculation report. Project format: .epd.' }) }] }
  ]));
}
function installIPC() {
  ipcMain.handle('project:choose-save', async (event, options) => {
    senderAllowed(event);
    const result = await dialog.showSaveDialog(windowRef, { title: 'Save project', defaultPath: path.join(app.getPath('documents'), safeName(options && options.suggestedName)), filters: [{ name: 'Connection Design Project', extensions: ['epd'] }] });
    return result.canceled ? null : recordFile(result.filePath);
  });
  ipcMain.handle('project:choose-open', async event => {
    senderAllowed(event);
    const result = await dialog.showOpenDialog(windowRef, { title: 'Open project', properties: ['openFile'], filters: [{ name: 'Connection Design / JSON', extensions: ['epd', 'json'] }] });
    return result.canceled || !result.filePaths.length ? null : recordFile(result.filePaths[0]);
  });
  ipcMain.handle('project:read', async (event, token) => { senderAllowed(event); return readSelected(token); });
  ipcMain.handle('project:write', async (event, token, text) => {
    senderAllowed(event);
    const filePath = chosenFile(token);
    if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_BYTES) throw new Error('Project file exceeds 1 MB.');
    const data = JSON.parse(text);
    if (data.application !== 'CONNECTION-DESIGN' || data.connection !== 'TOP-PLATE' || data.version !== 1) throw new Error('Invalid project format.');
    const temp = path.join(path.dirname(filePath), '.' + path.basename(filePath) + '.' + crypto.randomUUID() + '.tmp');
    writes++;
    try { await fs.writeFile(temp, text, { flag: 'wx' }); await fs.rename(temp, filePath); }
    finally { writes--; await fs.rm(temp, { force: true }).catch(() => {}); }
    return true;
  });
}
async function createWindow() {
  windowRef = new BrowserWindow({ width: 1440, height: 980, minWidth: 980, minHeight: 700, title: 'Connection Design', backgroundColor: '#e9edf1', icon: path.join(__dirname, 'assets/icon.png'), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true } });
  windowRef.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  windowRef.webContents.on('will-navigate', (event, target) => { if (target !== APP_URL) event.preventDefault(); });
  windowRef.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  windowRef.webContents.on('will-prevent-unload', event => {
    if (writes) return;
    const result = dialog.showMessageBoxSync(windowRef, { type: 'question', buttons: ['Keep Editing', 'Discard Changes'], defaultId: 0, cancelId: 0, title: 'Unsaved project', message: 'Close without saving the latest changes?' });
    if (result === 1) event.preventDefault();
  });
  windowRef.on('close', event => { if (writes) { event.preventDefault(); dialog.showMessageBox(windowRef, { type: 'info', message: 'A project is being saved. Close the application after saving finishes.' }); } });
  windowRef.webContents.on('did-finish-load', () => { ready = true; const queued = pending; pending = []; queued.forEach(deliverProject); });
  windowRef.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    let permitted = details.url.startsWith('data:') || details.url.startsWith('blob:') || details.url === 'about:blank';
    if (details.url.startsWith('file:')) { try { const relative = path.relative(__dirname, fileURLToPath(details.url)); permitted = !relative.startsWith('..') && !path.isAbsolute(relative); } catch { permitted = false; } }
    callback({ cancel: !permitted });
  });
  await windowRef.loadFile(APP_HTML);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  const first = fileFromArgs(process.argv); if (first) pending.push(first);
  app.on('second-instance', (_event, argv) => { if (windowRef) { if (windowRef.isMinimized()) windowRef.restore(); windowRef.focus(); } deliverProject(fileFromArgs(argv)); });
  app.on('open-file', (event, filePath) => { event.preventDefault(); deliverProject(filePath); });
  app.whenReady().then(async () => { app.setAppUserModelId('app.connectiondesign.desktop'); installIPC(); installMenu(); await createWindow(); }).catch(error => { dialog.showErrorBox('Application error', error.message); app.quit(); });
  app.on('window-all-closed', () => app.quit());
}
