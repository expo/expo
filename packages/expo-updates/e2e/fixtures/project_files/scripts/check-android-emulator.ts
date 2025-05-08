#!/usr/bin/env yarn --silent ts-node --transpile-only

const spawnAsync = require('@expo/spawn-async');
const delay = require('timers/promises').setTimeout;

const isEmulatorRunning = async () => {
  try {
    return (
      (
        await spawnAsync('adb', ['shell', 'getprop', 'sys.boot_completed'], {
          stdio: 'pipe',
        })
      ).stdout.trim() === '1'
    );
  } catch (e) {
    return false;
  }
};

const runScript = async () => {
  /*
  await spawnAsync('emulator', ['@pixel_4', '-no-audio', '-no-boot-anim'], {
    stdio: 'ignore',
    detached: true,
  });
   */

  const maxTries = 10;
  for (let i = 0; i < maxTries; i++) {
    console.warn(`Check number ${i} of ${maxTries}...`);
    const running = await isEmulatorRunning();
    console.warn(`isEmulatorRunning: ${running}`);
    if (running) {
      await spawnAsync('adb', ['reverse', 'tcp:4747', 'tcp:4747'], {
        stdio: 'ignore',
      });
      return;
    }
    await delay(3000);
  }
  throw new Error('Emulator failed to start');
};

runScript();
