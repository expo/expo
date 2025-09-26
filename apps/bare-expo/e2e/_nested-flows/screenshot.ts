// taking screenshots with Maestro is not reliable, hence this module
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScreenshotOptions {
  platform: 'ios' | 'android';
  outputFilePath: string;
  copyAlsoTo: string;
}

export async function takeScreenshot({
  platform,
  outputFilePath,
  copyAlsoTo,
}: ScreenshotOptions): Promise<void> {
  // Ensure the output directory exists
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const copyDir = path.dirname(copyAlsoTo);
  if (!fs.existsSync(copyDir)) {
    fs.mkdirSync(copyDir, { recursive: true });
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
  await fs.promises.copyFile(outputFilePath, copyAlsoTo);
  console.log(`Screenshot also copied to: ${copyAlsoTo}`);
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

    // Take screenshot using adb
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
