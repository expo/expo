#!/usr/bin/env bun
/**
 * run this to get a view shot without running the tests directly
 * */
import path from 'node:path';

import { takeScreenshot } from './takeScreenshot';
import { cropViewByTestID } from './viewCropper';

if (import.meta.main) {
  const [platformArg, testID, outputFolder, resizingFactorArg] = process.argv.slice(2);

  if (!platformArg || !testID || !outputFolder) {
    console.error('Usage: debug-screenshot.ts <platform> <testID> <outputFolder> [resizingFactor]');
    process.exit(1);
  }

  const platform = platformArg as 'ios' | 'android';
  const resizingFactor = parseFloat(resizingFactorArg) || 0.5;

  const fullScreenshotPath = path.join(outputFolder, '_full_screenshot_temp.png');
  const viewShotPath = path.join(outputFolder, `${testID}.png`);

  await takeScreenshot({ platform, outputFilePath: fullScreenshotPath });
  await cropViewByTestID({
    testID,
    currentScreenshotPath: fullScreenshotPath,
    viewShotPath,
    platform,
    displayScaleFactor: platform === 'android' ? 1 : 3,
    resizingFactor,
  });

  console.log(`✅ Saved ${testID} view shot to: ${viewShotPath}`);
}
