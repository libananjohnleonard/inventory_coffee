const fs = require('fs')
const http = require('http')
const path = require('path')
const { spawn, spawnSync } = require('child_process')
const dotenv = require('dotenv')

const rootDir = path.resolve(__dirname, '..')
const envPath = path.join(rootDir, '.env')
const pidFile = path.join(rootDir, '.server-4001.pid')
const outLog = path.join(rootDir, 'server-4001.out.log')
const errLog = path.join(rootDir, 'server-4001.err.log')
const serverEntry = path.join(rootDir, 'server', 'index.js')

dotenv.config({ path: envPath })

const port = Number(process.env.PORT || 4001)
const command = process.argv[2] || 'start'

function readPid() {
  if (!fs.existsSync(pidFile)) {
    return null
  }

  const pid = Number(fs.readFileSync(pidFile, 'utf8').trim())
  return Number.isInteger(pid) && pid > 0 ? pid : null
}

function clearPidFile() {
  if (fs.existsSync(pidFile)) {
    fs.unlinkSync(pidFile)
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function pingHealth() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/health',
        timeout: 1000,
      },
      (response) => {
        response.resume()
        resolve(response.statusCode === 200)
      },
    )

    request.on('error', () => resolve(false))
    request.on('timeout', () => {
      request.destroy()
      resolve(false)
    })
  })
}

async function start() {
  const existingPid = readPid()

  if (existingPid && isRunning(existingPid)) {
    console.log(`BrixCafee API is already running in the background on port ${port}.`)
    return
  }

  if (existingPid) {
    clearPidFile()
  }

  if (await pingHealth()) {
    console.log(`BrixCafee API is already responding on http://localhost:${port}.`)
    return
  }

  const out = fs.openSync(outLog, 'a')
  const err = fs.openSync(errLog, 'a')
  const child = spawn(process.execPath, [serverEntry], {
    cwd: rootDir,
    detached: true,
    env: process.env,
    stdio: ['ignore', out, err],
    windowsHide: true,
  })

  child.unref()
  fs.closeSync(out)
  fs.closeSync(err)
  fs.writeFileSync(pidFile, String(child.pid))

  console.log(`BrixCafee API started silently on http://localhost:${port}.`)
}

async function stop() {
  const existingPid = readPid()

  if (!existingPid) {
    if (await pingHealth()) {
      console.log(`A server is responding on port ${port}, but it was not started by the background launcher.`)
      return
    }

    console.log('No background BrixCafee API process is tracked right now.')
    return
  }

  if (!isRunning(existingPid)) {
    clearPidFile()
    console.log('Removed a stale background server record.')
    return
  }

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(existingPid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
  } else {
    process.kill(existingPid, 'SIGTERM')
  }

  clearPidFile()
  console.log('BrixCafee API background process stopped.')
}

async function status() {
  const existingPid = readPid()
  const healthy = await pingHealth()

  if (existingPid && isRunning(existingPid)) {
    console.log(`BrixCafee API is running in the background on PID ${existingPid}.`)
    return
  }

  if (existingPid) {
    clearPidFile()
  }

  if (healthy) {
    console.log(`BrixCafee API is responding on http://localhost:${port}, but it is not tracked by the launcher.`)
    return
  }

  console.log('BrixCafee API is offline.')
}

async function main() {
  if (command === 'start') {
    await start()
    return
  }

  if (command === 'stop') {
    await stop()
    return
  }

  if (command === 'status') {
    await status()
    return
  }

  console.error(`Unknown command "${command}". Use start, stop, or status.`)
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error.message || error)
  process.exitCode = 1
})
