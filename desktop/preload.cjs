'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('connectionDesktop', Object.freeze({
  chooseSave: options => ipcRenderer.invoke('project:choose-save', options),
  chooseOpen: () => ipcRenderer.invoke('project:choose-open'),
  read: token => ipcRenderer.invoke('project:read', token),
  write: (token, text) => ipcRenderer.invoke('project:write', token, text),
  onCommand: callback => { ipcRenderer.on('desktop:command', (_event, command) => callback(command)); },
  onProject: callback => { ipcRenderer.on('desktop:project', (_event, project) => callback(project)); }
}));
