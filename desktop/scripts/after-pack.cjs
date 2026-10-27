'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
module.exports = async context => {
  if (context.electronPlatformName !== 'win32') return;
  const files = [], directories = new Set();
  let bytes = 0;
  async function walk(relative) {
    for (const entry of await fs.readdir(path.join(context.appOutDir, relative), { withFileTypes: true })) {
      const name = relative ? relative + '/' + entry.name : entry.name;
      if (/["$\r\n]/.test(name)) throw new Error('Unsupported installer filename: ' + name);
      if (entry.isDirectory()) { directories.add(name); await walk(name); }
      else if (entry.isFile()) { files.push(name); bytes += (await fs.stat(path.join(context.appOutDir, name))).size; }
      else throw new Error('Unexpected entry in Windows payload: ' + name);
    }
  }
  await walk('');
  const lines = ['; Generated from the packaged application. Never recursively delete the install folder.', '!define APP_ESTIMATED_SIZE_KB ' + Math.ceil(bytes / 1024), '!macro RemoveApplicationFiles'];
  for (const name of files.sort()) lines.push('  Delete "$INSTDIR\\' + name.replaceAll('/', '\\') + '"');
  for (const name of [...directories].sort((a,b) => b.split('/').length - a.split('/').length)) lines.push('  RMDir "$INSTDIR\\' + name.replaceAll('/', '\\') + '"');
  lines.push('!macroend');
  await fs.writeFile(path.join(__dirname, '../assets/uninstall-files.nsh'), lines.join('\n') + '\n');
};
