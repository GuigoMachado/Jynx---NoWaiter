const { spawn, execSync } = require('child_process');
const { watch } = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const serverFile = path.join(__dirname, 'server.js');
const watchFiles = ['server.js', 'admin.js', 'script.js', 'style.css', 'admin.html', 'index.html'];
let child = null;
let restartPending = false;
let debounceTimer = null;

const killPortOwner = () => {
  if (process.platform !== 'win32') return;
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      if (/LISTENING/.test(line) || /LISTENING/i.test(line)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== `${process.pid}`) {
          console.log(`Killing previous process using port ${port}: PID ${pid}`);
          execSync(`taskkill /PID ${pid} /F`);
        }
      }
    }
  } catch (error) {
    // ignore if no process is using the port or if command fails
  }
};

const startServer = () => {
  if (child) return;
  killPortOwner();
  console.log('Starting server...');
  child = spawn('node', [serverFile], {
    stdio: 'inherit',
    env: { ...process.env, PORT: port }
  });

  child.on('exit', (code) => {
    child = null;
    if (code !== null && code !== 0) {
      console.log(`Server process exited with code ${code}`);
    }
    if (restartPending) {
      restartPending = false;
      startServer();
    }
  });
};

const restartServer = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (!child) {
      startServer();
      return;
    }

    restartPending = true;
    console.log('Changes detected; restarting server...');
    child.kill('SIGTERM');
  }, 100);
};

watchFiles.forEach((file) => {
  const fullPath = path.join(__dirname, file);
  watch(fullPath, { persistent: true }, () => {
    restartServer();
  });
});

process.on('SIGINT', () => {
  if (child) child.kill('SIGTERM');
  process.exit();
});

startServer();
