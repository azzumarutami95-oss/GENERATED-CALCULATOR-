'use strict';
const { _electron } = require('playwright-core');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'connection-design-test-'));
  const projectFile = path.join(dir, 'Test-Project.epd'), copyFile = path.join(dir, 'Test-Copy.epd'), pdfFile = path.join(dir, 'Test-Report.pdf');
  const installed = process.env.CONNECTION_DESIGN_EXE;
  const application = await _electron.launch({
    executablePath: installed || require('electron'),
    args: [...(process.platform === 'linux' ? ['--no-sandbox'] : []), '--disable-gpu', ...(installed ? [] : [path.resolve(__dirname, '..')])],
    timeout: 90000
  });
  let page;
  try {
    page = await application.firstWindow();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => typeof current !== 'undefined' && !!current);
    assert.equal(await page.title(), 'Connection Design — Embedded Head Plate');
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
    assert.equal(await page.evaluate(() => typeof window.process), 'undefined');
    assert.equal(await page.evaluate(() => nativeFilePicker('showSaveFilePicker')), true);
    const baseline = await page.evaluate(() => ({ area: current.r.As, capacity: current.r.breakout.capacity, tieLegs: current.r.extended.tie.requiredLegs }));
    assert.equal(baseline.area, 8192);
    assert.ok(Math.abs(baseline.capacity - 82.74727278314275) < 1e-8);
    assert.equal(baseline.tieLegs, 3);
    await application.evaluate(({ dialog }, destinations) => {
      global.__desktopSaveCount = 0;
      dialog.showSaveDialog = async (_window, options) => {
        if (options.filters && options.filters[0].extensions.includes('pdf')) return { canceled: false, filePath: destinations.pdfFile };
        global.__desktopSaveCount++;
        return { canceled: false, filePath: global.__desktopSaveCount === 1 ? destinations.projectFile : destinations.copyFile };
      };
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [destinations.projectFile] });
    }, { projectFile, copyFile, pdfFile });
    await page.click('#saveProject');
    await page.waitForFunction(() => !projectSession.busy && projectSession.mode === 'native');
    const saved = JSON.parse(await fs.readFile(projectFile, 'utf8'));
    assert.equal(saved.application, 'CONNECTION-DESIGN');
    assert.equal(saved.model.version, 5);
    await page.click('.tree-input[data-input="1"]');
    await page.fill('#tp', '32');
    await page.click('#saveProject');
    await page.waitForFunction(() => !projectSession.busy && !isProjectDirty());
    assert.equal(JSON.parse(await fs.readFile(projectFile, 'utf8')).model.inputs.tp, '32');
    assert.equal(await application.evaluate(() => global.__desktopSaveCount), 1);
    await page.fill('#tp', '38');
    await page.click('#saveProjectAs');
    await page.waitForFunction(() => !projectSession.busy && projectSession.fileName === 'Test-Copy.epd');
    assert.equal(JSON.parse(await fs.readFile(projectFile, 'utf8')).model.inputs.tp, '32');
    assert.equal(JSON.parse(await fs.readFile(copyFile, 'utf8')).model.inputs.tp, '38');
    await page.evaluate(() => { window.confirm = () => true; });
    await page.click('#import');
    await page.waitForFunction(() => !projectSession.busy && current.p.tp === 32);
    await page.fill('#tp', '40');
    await application.evaluate(({ app }, projectPath) => { app.emit('second-instance', {}, [app.getPath('exe'), projectPath]); }, projectFile);
    await page.waitForFunction(() => current.p.tp === 32 && !isProjectDirty());
    assert.equal(await page.evaluate(async () => { try { await window.connectionDesktop.read('not-a-chosen-file'); return false; } catch { return true; } }), true);
    await page.click('#reset');
    await page.click('#tab-model');
    await page.evaluate(() => { $('message').textContent = ''; });
    const output = path.resolve(__dirname, '../dist');
    await fs.mkdir(output, { recursive: true });
    await page.screenshot({ path: path.join(output, installed ? 'installed-windows.png' : 'desktop-smoke.png') });
    await application.evaluate(({ Menu }) => {
      const file = Menu.getApplicationMenu().items.find(item => item.label === 'File');
      file.submenu.items.find(item => item.label === 'Export Report PDF…').click();
    });
    for (let i = 0; i < 100; i++) {
      try { if ((await fs.stat(pdfFile)).size > 1000) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal((await fs.readFile(pdfFile)).subarray(0, 4).toString(), '%PDF');
    assert.deepEqual(errors, []);
    await page.evaluate(() => { projectSession.baseline = inputFingerprint(); });
    console.log(JSON.stringify({ target: installed ? 'installed-windows' : process.platform, baseline, passed: ['English UI', 'calculation baseline', 'isolated renderer', 'native Save', 'native overwrite', 'Save As', 'native Open', 'project association event', 'file token validation', 'PDF export'], projectFile, pdfFile }));
  } finally {
    if (page) await page.evaluate(() => { projectSession.baseline = inputFingerprint(); }).catch(() => {});
    await application.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
