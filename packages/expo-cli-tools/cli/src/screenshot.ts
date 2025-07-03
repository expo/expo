import chalk from 'chalk';
import { execSync } from 'child_process';
import { ExpoCliOutput, ExpoCliApplication } from 'expo-cli-extensions';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const takeScreenshot = (app: ExpoCliApplication): string => {
  const platform = getAppPlatform(app);
  // create temp filename
  const tempDir = os.tmpdir();
  const tempFileName = `tempfile-${Date.now()}.png`;
  const tempFilePath = path.join(tempDir, tempFileName);

  if (platform === 'android') {
    execSync('adb shell screencap -p /sdcard/screenshot.png');
    execSync(`adb pull /sdcard/screenshot.png ${tempFilePath}`);
  } else {
    const command = `xcrun simctl io booted screenshot '${tempFilePath}';`;
    execSync(command);
  }
  return tempFilePath;
};

const getAppPlatform = (app: ExpoCliApplication): 'ios' | 'android' => {
  if (app.deviceName.startsWith('sdk_')) {
    return 'android';
  } else {
    return 'ios';
  }
};
