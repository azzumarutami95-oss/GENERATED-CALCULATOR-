'use strict';
(() => {
  const bridge = window.connectionDesktop;
  if (!bridge) return;
  const canceled = () => new DOMException('The file dialog was canceled.', 'AbortError');
  function fileHandle(record) {
    return {
      name: record.name,
      kind: 'file',
      async getFile() { const data = await bridge.read(record.token); return new File([data.text], record.name, { type: 'application/json' }); },
      async createWritable() {
        let contents = '', finished = false;
        return {
          async write(value) { if (finished || typeof value !== 'string') throw new Error('Invalid project write.'); contents = value; },
          async close() { if (finished) throw new Error('Project stream is closed.'); await bridge.write(record.token, contents); finished = true; },
          async abort() { finished = true; contents = ''; }
        };
      }
    };
  }
  window.showSaveFilePicker = async options => {
    const result = await bridge.chooseSave({ suggestedName: options && options.suggestedName });
    if (!result) throw canceled();
    return fileHandle(result);
  };
  window.showOpenFilePicker = async () => {
    const result = await bridge.chooseOpen();
    if (!result) throw canceled();
    return [fileHandle(result)];
  };
  bridge.onCommand(command => {
    const id = { new: 'newProject', open: 'import', save: 'saveProject', saveAs: 'saveProjectAs', export: 'export', check: 'recalculate', report: 'openReport', print: 'print' }[command];
    const button = id && document.getElementById(id);
    if (button && !button.disabled) button.click();
  });
  bridge.onProject(async record => {
    try {
      if (typeof confirmReplace !== 'function' || !confirmReplace()) return;
      const handle = fileHandle(record), file = await handle.getFile();
      await readProjectFile(file, handle);
    } catch (error) {
      const message = document.getElementById('message');
      if (message) message.textContent = 'Project not opened: ' + error.message;
    }
  });
})();
