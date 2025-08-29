#!/usr/bin/env node
// @ts-check

const { spawn } = require('child_process');

const TARGET_DEVICE = 'iPhone 16 Pro';
const TARGET_DEVICE_IOS_VERSION = 18;

async function bootSimulatorAsync(deviceId, deviceName = TARGET_DEVICE) {
  console.log(`📱 Booting Device - name[${deviceName}] udid[${deviceId}]`);
  await spawnAsync('xcrun', ['simctl', 'bootstatus', deviceId, '-b'], { stdio: 'inherit' });

  // Only open Simulator app if not in CI environment
  if (!process.env.CI) {
    await spawnAsync('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', deviceId], {
      stdio: 'inherit',
    });
  }
}

// Run as standalone script if called directly
if (require.main === module) {
  (async () => {
    try {
      const device = await queryDeviceIdAsync(TARGET_DEVICE_IOS_VERSION, TARGET_DEVICE);
      if (!device) {
        throw new Error(`Device not found: ${TARGET_DEVICE}`);
      }

      await bootSimulatorAsync(device.udid, TARGET_DEVICE);
      console.log(`✅ Device ready: ${device.udid} ${device.name}`);
    } catch (e) {
      console.error('Error booting simulator:', e);
      process.exit(1);
    }
  })();
}

/**
 * Query simulator UDID
 * @param {number?} iosVersion
 * @param {string?} device
 * @returns {Promise<{ udid: string, name: string } | null>}
 */
async function queryDeviceIdAsync(iosVersion = TARGET_DEVICE_IOS_VERSION, device = TARGET_DEVICE) {
  const { stdout } = await spawnAsync('xcrun', [
    'simctl',
    'list',
    'devices',
    'iPhone',
    'available',
    '--json',
  ]);
  const { devices: deviceWithRuntimes } = JSON.parse(stdout);

  // Try to find the target device first
  for (const [runtime, devices] of Object.entries(deviceWithRuntimes)) {
    if (runtime.startsWith(`com.apple.CoreSimulator.SimRuntime.iOS-${iosVersion}-`)) {
      for (const { name, udid } of devices) {
        if (name === device) {
          return {
            udid,
            name,
          };
        }
      }
    }
  }

  // Fallback to the first available device
  const firstEntry = Object.entries(deviceWithRuntimes).find(
    ([runtime, devices]) => devices.length > 0
  );
  const maybeUdid = firstEntry?.[1][0]?.udid;
  return maybeUdid
    ? {
        udid: maybeUdid,
        name: firstEntry?.[1][0]?.name,
      }
    : null;
}

// alternative to @expo/spawn-async so that CI job can run this without node_modules installed
function spawnAsync(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    if (child.stdout && !options.stdio) {
      child.stdout.on('data', (data) => {
        stdout += data;
      });
    }

    if (child.stderr && !options.stdio) {
      child.stderr.on('data', (data) => {
        stderr += data;
      });
    }

    child.on('close', (code, signal) => {
      const result = {
        pid: child.pid,
        output: [stdout, stderr],
        stdout,
        stderr,
        status: code,
        signal,
      };

      if (code !== 0) {
        const argumentString = args && args.length > 0 ? ` ${args.join(' ')}` : '';
        const error = signal
          ? new Error(`${command}${argumentString} exited with signal: ${signal}`)
          : new Error(`${command}${argumentString} exited with non-zero code: ${code}`);
        Object.assign(error, result);
        reject(error);
      } else {
        resolve(result);
      }
    });

    child.on('error', (error) => {
      Object.assign(error, {
        pid: child.pid,
        output: [stdout, stderr],
        stdout,
        stderr,
        status: null,
        signal: null,
      });
      reject(error);
    });
  });
}

module.exports = {
  bootSimulatorAsync,
  queryDeviceIdAsync,
};
