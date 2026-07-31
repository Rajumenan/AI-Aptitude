const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== STARTING FULL STACK PLATFORM ===\n');

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

// Platform-aware npm command to prevent DEP0190 warnings when spawning child processes
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Helper to format process output
const logOutput = (prefix, data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      console.log(`[${prefix}] ${trimmed}`);
    }
  }
};

// Check and install dependencies if node_modules is missing or required binaries are absent
const checkAndInstall = (dirName, dirPath) => {
  const nodeModulesPath = path.join(dirPath, 'node_modules');
  const isFrontend = dirName === 'Frontend';
  
  // Check if node_modules is missing, or for frontend if the vite executable is missing
  const needsInstall = !fs.existsSync(nodeModulesPath) || 
    (isFrontend && !fs.existsSync(path.join(nodeModulesPath, '.bin', 'vite')) && !fs.existsSync(path.join(nodeModulesPath, '.bin', 'vite.cmd')));

  if (needsInstall) {
    console.log(`-> [${dirName}] Required dependencies or binaries not found. Installing...`);
    try {
      execSync(`${npmCmd} install`, { 
        cwd: dirPath, 
        stdio: 'inherit'
      });
      console.log(`-> [${dirName}] Dependencies successfully installed!\n`);
    } catch (err) {
      console.error(`-> [${dirName}] Failed to install dependencies:`, err.message);
      process.exit(1);
    }
  }
};

// Run self-healing check
checkAndInstall('Backend', backendDir);
checkAndInstall('Frontend', frontendDir);

// 1. Spawn Backend Process
console.log('-> Launching Backend Service (Express + MongoDB)...');
const backend = spawn('npm run dev', { 
  cwd: backendDir,
  shell: true
});

backend.stdout.on('data', (data) => logOutput('Backend', data));
backend.stderr.on('data', (data) => logOutput('Backend', data));

// 2. Spawn Frontend Process
console.log('-> Launching Frontend Service (Vite Development Server)...');
const frontend = spawn('npm start', { 
  cwd: frontendDir,
  shell: true
});

frontend.stdout.on('data', (data) => logOutput('Frontend', data));
frontend.stderr.on('data', (data) => logOutput('Frontend', data));

// Handle process termination cleanly
let isCleaningUp = false;
const cleanup = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\n=== Terminating subprocesses... ===');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backend.on('exit', (code) => {
  if (code !== null && !isCleaningUp) {
    console.log(`Backend process exited with code ${code}`);
    cleanup();
  }
});

frontend.on('exit', (code) => {
  if (code !== null && !isCleaningUp) {
    console.log(`Frontend process exited with code ${code}`);
    cleanup();
  }
});
