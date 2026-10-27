'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
(async () => {
  const binary = process.env.CONNECTION_DESIGN_XVFB;
  if (!binary) throw new Error('Set CONNECTION_DESIGN_XVFB to a verified Xvfb binary.');
  const display = ':97';
  const server = spawn(binary, [display, '-screen', '0', '1440x1000x24', '-nolisten', 'tcp', '-ac'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let errors = '';
  server.stderr.on('data', data => { errors += data; });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { await fs.stat('/tmp/.X11-unix/X97'); ready = true; break; } catch {}
      if (server.exitCode !== null) throw new Error('Xvfb failed: ' + errors);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Xvfb readiness timed out: ' + errors);
    const child = spawn(process.execPath, [path.join(__dirname, 'smoke.cjs')], { env: { ...process.env, DISPLAY: display }, stdio: 'inherit' });
    const code = await new Promise(resolve => child.once('exit', resolve));
    if (code !== 0) process.exitCode = code || 1;
  } finally { server.kill('SIGTERM'); }
})().catch(error => { console.error(error); process.exitCode = 1; });
