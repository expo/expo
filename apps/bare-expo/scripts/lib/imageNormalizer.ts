#!/usr/bin/env bun
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';

export interface NormalizationOptions {
  targetWidth: number;
  targetHeight: number;
  backgroundColor: number; // RGBA as number (e.g., 0xffffffff for white)
  quality: number;
}

export interface OptimalDimensions {
  width: number;
  height: number;
}

export interface NormalizedImages {
  normalizedImage1Path: string;
  normalizedImage2Path: string;
}

export class ImageNormalizer {
  /**
   * Calculate optimal target dimensions for cross-platform comparison.
   * Minimizes padding by using smart aspect ratio averaging and balanced dimensions.
   */
  async getOptimalTargetDimensions(
    image1Path: string,
    image2Path: string
  ): Promise<OptimalDimensions> {
    const img1 = PNG.sync.read(fs.readFileSync(image1Path));
    const img2 = PNG.sync.read(fs.readFileSync(image2Path));

    // Calculate aspect ratios
    const ratio1 = img1.width / img1.height;
    const ratio2 = img2.width / img2.height;

    // Calculate average aspect ratio for balanced target
    const avgRatio = (ratio1 + ratio2) / 2;

    // Use average of dimensions instead of max to reduce padding
    const avgWidth = Math.round((img1.width + img2.width) / 2);
    const avgHeight = Math.round((img1.height + img2.height) / 2);

    // Calculate pixel areas to understand relative sizes
    const area1 = img1.width * img1.height;
    const area2 = img2.width * img2.height;
    const avgArea = (area1 + area2) / 2;

    // Choose strategy based on aspect ratio similarity
    const aspectRatioDiff = Math.abs(ratio1 - ratio2);

    if (aspectRatioDiff > 0.1) {
      // Different aspect ratios - use average ratio with balanced area
      const targetWidth = Math.round(Math.sqrt(avgArea * avgRatio));
      const targetHeight = Math.round(targetWidth / avgRatio);

      // Ensure dimensions are reasonable (not too small)
      const minDimension = Math.min(
        Math.min(img1.width, img1.height),
        Math.min(img2.width, img2.height)
      );

      return {
        width: Math.max(targetWidth, minDimension),
        height: Math.max(targetHeight, Math.round(minDimension / avgRatio)),
      };
    }

    // Similar aspect ratios - use average dimensions
    return { width: avgWidth, height: avgHeight };
  }

  /**
   * Normalize two images for cross-platform comparison by resizing and padding.
   */
  async normalizeImagesForComparison(
    image1Path: string,
    image2Path: string,
    options: NormalizationOptions
  ): Promise<NormalizedImages> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'image-normalizer-'));

    const normalizedImage1Path = path.join(tempDir, 'normalized_image1.png');
    const normalizedImage2Path = path.join(tempDir, 'normalized_image2.png');

    await Promise.all([
      this.normalizeImage(image1Path, normalizedImage1Path, options),
      this.normalizeImage(image2Path, normalizedImage2Path, options),
    ]);

    return {
      normalizedImage1Path,
      normalizedImage2Path,
    };
  }

  /**
   * Normalize a single image to target dimensions with proportional scaling and padding.
   */
  private async normalizeImage(
    inputPath: string,
    outputPath: string,
    options: NormalizationOptions
  ): Promise<void> {
    const { targetWidth, targetHeight, backgroundColor } = options;

    // Read original image
    const originalPng = PNG.sync.read(fs.readFileSync(inputPath));
    const originalWidth = originalPng.width;
    const originalHeight = originalPng.height;

    // Calculate scaling factor to fit within target dimensions while preserving aspect ratio
    const scaleX = targetWidth / originalWidth;
    const scaleY = targetHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = Math.round(originalWidth * scale);
    const scaledHeight = Math.round(originalHeight * scale);

    // Calculate padding - center horizontally, align to top vertically
    const padLeft = Math.floor((targetWidth - scaledWidth) / 2);
    const padTop = 0; // Never add padding to top

    // Create target image with background color
    const targetPng = new PNG({ width: targetWidth, height: targetHeight });

    // Convert RGBA number to individual components
    const r = (backgroundColor >> 24) & 0xff;
    const g = (backgroundColor >> 16) & 0xff;
    const b = (backgroundColor >> 8) & 0xff;
    const a = backgroundColor & 0xff;

    // Fill background
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const idx = (targetWidth * y + x) * 4;
        targetPng.data[idx] = r;
        targetPng.data[idx + 1] = g;
        targetPng.data[idx + 2] = b;
        targetPng.data[idx + 3] = a;
      }
    }

    // Resize and copy original image using nearest neighbor sampling
    for (let y = 0; y < scaledHeight; y++) {
      for (let x = 0; x < scaledWidth; x++) {
        // Map scaled coordinates back to original coordinates
        const origX = Math.floor((x / scaledWidth) * originalWidth);
        const origY = Math.floor((y / scaledHeight) * originalHeight);

        // Get pixel from original image
        const origIdx = (originalWidth * origY + origX) * 4;

        // Set pixel in target image (with padding offset)
        const targetX = x + padLeft;
        const targetY = y + padTop;
        const targetIdx = (targetWidth * targetY + targetX) * 4;

        if (
          targetX < targetWidth &&
          targetY < targetHeight &&
          origX < originalWidth &&
          origY < originalHeight
        ) {
          targetPng.data[targetIdx] = originalPng.data[origIdx];
          targetPng.data[targetIdx + 1] = originalPng.data[origIdx + 1];
          targetPng.data[targetIdx + 2] = originalPng.data[origIdx + 2];
          targetPng.data[targetIdx + 3] = originalPng.data[origIdx + 3];
        }
      }
    }

    // Write the normalized image
    fs.writeFileSync(outputPath, PNG.sync.write(targetPng));
  }
}
