const path = require('path')
const { spawn, spawnSync } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const serverLauncher = path.join(__dirname, 'server-bg.cjs')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const clientCommand = process.platform === 'win32' ? 'cmd.exe' : npmCommand
const clientArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm run dev:client']
    : ['run', 'dev:client']

const serverResult = spawnSync(process.execPath, [serverLauncher, 'start'], {
  cwd: rootDir,
  stdio: 'inherit',
  windowsHide: true,
})

if (serverResult.status !== 0) {
  process.exit(serverResult.status || 1)
}

const clientProcess = spawn(clientCommand, clientArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  windowsHide: false,
})

clientProcess.on('exit', (code) => {
  process.exit(code ?? 0)
})

clientProcess.on('error', (error) => {
  console.error(error.message || error)
  process.exit(1)
})
