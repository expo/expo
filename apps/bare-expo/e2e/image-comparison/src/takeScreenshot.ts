// taking screenshots with Maestro is not reliable (for example, taking one screenshot would work, but taking two in a row would time out)
// hence this module

import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface ScreenshotOptions {
  platform: 'ios' | 'android';
  outputFilePath: string;
}

export async function takeScreenshot({
  platform,
  outputFilePath,
}: ScreenshotOptions): Promise<void> {
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const label = `${platform} screenshot duration`;
  console.time(label);

  if (platform === 'ios') {
    await takeIOSScreenshot(outputFilePath);
  } else if (platform === 'android') {
    await takeAndroidScreenshot(outputFilePath);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  console.timeEnd(label);
}

async function takeIOSScreenshot(outputPath: string): Promise<void> {
  try {
    await execAsync(`xcrun simctl io booted screenshot "${outputPath}"`);

    console.log(`iOS screenshot saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Failed to take iOS screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function takeAndroidScreenshot(outputPath: string): Promise<void> {
  try {
    console.log(`Taking screenshot of Android device/emulator`);

    // Take a screenshot using adb
    const tempPath = `/sdcard/screenshot_temp.png`;
    await execAsync(`adb shell screencap -p ${tempPath}`);

    // Pull the screenshot to the desired location
    await execAsync(`adb pull ${tempPath} "${outputPath}"`);

    // Clean up the temporary file on device
    await execAsync(`adb shell rm ${tempPath}`).catch(() => {
      // Ignore cleanup errors
    });

    console.log(`Android screenshot saved to: ${outputPath}`);
  } catch (error) {
    throw new Error(
      `Failed to take Android screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
