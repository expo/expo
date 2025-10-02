#!/usr/bin/env bun
import * as fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { ImageNormalizer, type NormalizationOptions } from './lib/imageNormalizer';

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
    message = `✅ Images are similar (${diffPercentage}% difference, similarityThreshold ${similarityThreshold})`;
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
  crossPlatformMode?: boolean;
  normalizationOptions?: NormalizationOptions;
}

export async function compareImages({
  image1Path,
  image2Path,
  outputPath,
  similarityThreshold,
  crossPlatformMode = false,
  normalizationOptions,
}: CompareImagesOptions): Promise<ComparisonResult> {
  try {
    if (!fs.existsSync(image1Path)) {
      return createErrorResult(`Image 1 not found: ${image1Path}`);
    }

    if (!fs.existsSync(image2Path)) {
      return createErrorResult(`Image 2 not found: ${image2Path}`);
    }

    let finalImage1Path = image1Path;
    let finalImage2Path = image2Path;

    // Handle cross-platform mode with different dimensions
    if (crossPlatformMode) {
      similarityThreshold = 15; // Relax the threshold for cross-platform comparisons
      const img1 = PNG.sync.read(fs.readFileSync(image1Path));
      const img2 = PNG.sync.read(fs.readFileSync(image2Path));

      // Check if dimensions are different
      if (img1.width !== img2.width || img1.height !== img2.height) {
        console.log(`Cross-platform mode: Normalizing images with different dimensions`);
        console.log(`Image 1: ${img1.width}x${img1.height}, Image 2: ${img2.width}x${img2.height}`);

        const normalizer = new ImageNormalizer();

        // Calculate optimal target dimensions based on the actual images
        const optimalDimensions = await normalizer.getOptimalTargetDimensions(
          image1Path,
          image2Path
        );

        // Use provided options or calculated optimal dimensions
        const defaultOptions: NormalizationOptions = {
          targetWidth: optimalDimensions.width,
          targetHeight: optimalDimensions.height,
          backgroundColor: 0xffffffff, // White background
          quality: 100,
        };

        const options = normalizationOptions || defaultOptions;

        const { normalizedImage1Path, normalizedImage2Path } =
          await normalizer.normalizeImagesForComparison(image1Path, image2Path, options);

        finalImage1Path = normalizedImage1Path;
        finalImage2Path = normalizedImage2Path;

        console.log(`Normalized images to: ${options.targetWidth}x${options.targetHeight}`);
        console.log(`Image 1 normalized path: ${finalImage1Path}`);
        console.log(`Image 2 normalized path: ${finalImage2Path}`);
      }
    }

    const img1 = PNG.sync.read(fs.readFileSync(finalImage1Path));
    const img2 = PNG.sync.read(fs.readFileSync(finalImage2Path));

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
      fs.writeFileSync(outputPath, PNG.sync.write(diff));
      return outputPath;
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

async function compareImagesSync(options: CompareImagesOptions): Promise<void> {
  const { message, success } = await compareImages(options);
  const exitCode = success ? 0 : 1;

  if (success) {
    console.log(message);
  } else {
    console.error(message);
  }

  process.exit(exitCode);
}

// If this script is run directly, compare the two images provided as command line arguments
if (require.main === module) {
  const [, , image1Path, image2Path, outputPath] = process.argv;

  if (image1Path && image2Path) {
    compareImagesSync({ image1Path, image2Path, outputPath }).catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
  } else {
    throw new Error('Usage: compare-images.ts <image1> <image2> [outputDiffImage]');
  }
}
