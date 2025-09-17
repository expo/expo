#!/usr/bin/env bun
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

export interface ComparisonResult {
  success: boolean;
  diffPercentage: number;
  totalPixels: number;
  diffPixels: number;
  message: string;
  error?: string;
}

function createErrorResult(
  message: string,
  error: string,
  totalPixels: number = 0
): ComparisonResult {
  return {
    success: false,
    diffPercentage: 0,
    totalPixels,
    diffPixels: 0,
    message,
    error,
  };
}

function createSuccessResult(
  diffPixels: number,
  totalPixels: number,
  diffPercentage: number
): ComparisonResult {
  const success = diffPercentage < 5;
  let message: string;

  if (diffPixels === 0) {
    message = 'Images are identical';
  } else if (diffPercentage < 5) {
    message = 'Images are very similar (< 5% difference)';
  } else {
    message = 'Images are significantly different';
  }

  return {
    success,
    diffPercentage: parseFloat(diffPercentage.toFixed(2)),
    totalPixels,
    diffPixels,
    message,
  };
}

export function compareImages(
  image1Path: string,
  image2Path: string,
  outputPath?: string
): ComparisonResult {
  try {
    if (!fs.existsSync(image1Path)) {
      return createErrorResult('Image 1 not found', `Image 1 not found: ${image1Path}`);
    }

    if (!fs.existsSync(image2Path)) {
      return createErrorResult('Image 2 not found', `Image 2 not found: ${image2Path}`);
    }

    const img1 = PNG.sync.read(fs.readFileSync(image1Path));
    const img2 = PNG.sync.read(fs.readFileSync(image2Path));

    const { width, height } = img1;

    if (img2.width !== width || img2.height !== height) {
      return createErrorResult(
        "Image dimensions don't match",
        `Image dimensions don't match: ${width}x${height} vs ${img2.width}x${img2.height}`,
        width * height
      );
    }

    const diff = new PNG({ width, height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
      threshold: 0.1,
      includeAA: false,
    });

    if (outputPath) {
      const expandedPath = expandTilde(outputPath);
      fs.mkdirSync(path.dirname(expandedPath), { recursive: true });
      fs.writeFileSync(expandedPath, PNG.sync.write(diff));
      console.log(`Diff image written to: ${path.resolve(expandedPath)}`);
    }

    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

    return createSuccessResult(numDiffPixels, totalPixels, diffPercentage);
  } catch (error) {
    return createErrorResult(
      'Image comparison failed',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

function getExitMessage(result: ComparisonResult): { message: string; exitCode: number } {
  if (result.error) {
    return { message: result.error, exitCode: 1 };
  }

  if (result.diffPixels === 0) {
    return { message: '✅ Images are identical', exitCode: 0 };
  } else if (result.diffPercentage < 5) {
    return { message: '⚠️  Images are very similar (< 5% difference)', exitCode: 0 };
  } else {
    return { message: '❌ Images are significantly different', exitCode: 1 };
  }
}

export function compareImagesSync(
  image1Path: string,
  image2Path: string,
  outputPath?: string
): void {
  const result = compareImages(image1Path, image2Path, outputPath);
  const { message, exitCode } = getExitMessage(result);

  console.log(`Difference: ${result.diffPercentage}%`);

  if (result.error) {
    console.error(message);
  } else {
    console.log(message);
  }

  process.exit(exitCode);
}

// If this script is run directly, compare the two images provided as command line arguments
if (require.main === module) {
  const [, , image1Path, image2Path, outputPath] = process.argv;

  if (image1Path && image2Path) {
    compareImagesSync(image1Path, image2Path, outputPath);
  } else {
    throw new Error('Usage: compare-images.ts <image1> <image2> [outputDiffImage]');
  }
}
