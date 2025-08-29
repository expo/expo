#!/usr/bin/env node
// @ts-check

const spawnAsync = require('@expo/spawn-async');

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

module.exports = {
  bootSimulatorAsync,
  queryDeviceIdAsync,
};
