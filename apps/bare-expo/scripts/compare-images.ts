#!/usr/bin/env bun
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface ComparisonResult {
  success: boolean;
  diffPercentage: number;
  totalPixels: number;
  diffPixels: number;
  message: string;
  diffImagePath?: string;
}

function createErrorResult(message: string, totalPixels: number = 0): ComparisonResult {
  return {
    success: false,
    diffPercentage: 0,
    totalPixels,
    diffPixels: 0,
    message,
  };
}

function createSuccessResult(
  diffPixels: number,
  totalPixels: number,
  diffPercentage: number,
  similarityThreshold: number,
  diffImagePath?: string
): ComparisonResult {
  const success = diffPercentage <= similarityThreshold;
  let message: string;

  if (diffPixels === 0) {
    message = '✅ Images are identical';
  } else if (success) {
    message = `✅ Images are very similar (${diffPercentage}% difference)`;
  } else {
    message = `❌ Images are significantly different (${diffPercentage}% difference)`;
  }

  return {
    success,
    diffPercentage,
    totalPixels,
    diffPixels,
    message,
    diffImagePath,
  };
}

export interface CompareImagesOptions {
  image1Path: string;
  image2Path: string;
  outputPath?: string;
  similarityThreshold?: number;
}

export function compareImages(options: CompareImagesOptions): ComparisonResult {
  const { image1Path, image2Path, outputPath, similarityThreshold = 5 } = options;
  try {
    if (!fs.existsSync(image1Path)) {
      return createErrorResult(`Image 1 not found: ${image1Path}`);
    }

    if (!fs.existsSync(image2Path)) {
      return createErrorResult(`Image 2 not found: ${image2Path}`);
    }

    const img1 = PNG.sync.read(fs.readFileSync(image1Path));
    const img2 = PNG.sync.read(fs.readFileSync(image2Path));

    const { width, height } = img1;

    if (img2.width !== width || img2.height !== height) {
      return createErrorResult(
        `Image dimensions don't match: ${width}x${height} vs ${img2.width}x${img2.height}`,
        width * height
      );
    }

    const diff = new PNG({ width, height });
    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
      threshold: 0.1,
      includeAA: false,
    });

    const diffImagePath = (() => {
      if (!outputPath) {
        return undefined;
      }
      const expandedPath = expandTilde(outputPath);
      fs.mkdirSync(path.dirname(expandedPath), { recursive: true });
      fs.writeFileSync(expandedPath, PNG.sync.write(diff));
      return path.resolve(expandedPath);
    })();

    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;
    const diffPercentageFormatted = parseFloat(diffPercentage.toFixed(2));

    return createSuccessResult(
      numDiffPixels,
      totalPixels,
      diffPercentageFormatted,
      similarityThreshold,
      diffImagePath
    );
  } catch (error) {
    return createErrorResult(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

function compareImagesSync(options: CompareImagesOptions): void {
  const { message, success } = compareImages(options);
  const exitCode = success ? 0 : 1;

  if (success) {
    console.log(message);
  } else {
    console.error(message);
  }

  process.exit(exitCode);
}

function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

// If this script is run directly, compare the two images provided as command line arguments
if (require.main === module) {
  const [, , image1Path, image2Path, outputPath] = process.argv;

  if (image1Path && image2Path) {
    compareImagesSync({ image1Path, image2Path, outputPath });
  } else {
    throw new Error('Usage: compare-images.ts <image1> <image2> [outputDiffImage]');
  }
}
