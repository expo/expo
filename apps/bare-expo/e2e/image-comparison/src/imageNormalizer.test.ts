import { describe, expect, it, afterAll } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { getOptimalTargetDimensions, normalizeImagesForComparison } from './imageNormalizer';
import { readPNG } from './pngUtils';

const FIXTURES_DIR = path.join(__dirname, '../test-fixtures');

describe('ImageNormalizer', () => {
  const tempDirs: string[] = [];

  afterAll(async () => {
    // Clean up temp directories
    for (const dir of tempDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should create normalized images with correct dimensions', async () => {
    const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
    const image2 = path.join(FIXTURES_DIR, 'blue-800x450.png');

    const dimensions = await getOptimalTargetDimensions(image1, image2);

    // Average width: (400 + 800) / 2 = 600
    // Average height: (225 + 450) / 2 = 337.5 -> 338
    expect(dimensions.width).toBe(600);
    expect(dimensions.height).toBe(338);

    const result = await normalizeImagesForComparison(image1, image2, {
      targetWidth: dimensions.width,
      targetHeight: dimensions.height,
      backgroundColor: 0xffffffff,
      quality: 100,
    });

    // Track temp directory for cleanup
    tempDirs.push(path.dirname(result.normalizedImage1Path));

    // Verify dimensions
    const img1 = await readPNG(result.normalizedImage1Path);
    const img2 = await readPNG(result.normalizedImage2Path);

    expect(img1.width).toBe(600);
    expect(img1.height).toBe(338);
    expect(img2.width).toBe(600);
    expect(img2.height).toBe(338);
  });

  it('should normalize images with different aspect ratios', async () => {
    const image1 = path.join(FIXTURES_DIR, 'header-Appearance.android.png');
    const image2 = path.join(FIXTURES_DIR, 'header-Appearance.ios.png');

    const dimensions = await getOptimalTargetDimensions(image1, image2);

    // Aspect ratio difference > 0.1, so uses area-based calculation
    // The dimensions should be calculated using average aspect ratio and area
    expect(dimensions.width).toBe(1272);
    expect(dimensions.height).toBe(71);

    const result = await normalizeImagesForComparison(image1, image2, {
      targetWidth: dimensions.width,
      targetHeight: dimensions.height,
      backgroundColor: 0xffffffff,
      quality: 100,
    });

    // Track temp directory for cleanup
    tempDirs.push(path.dirname(result.normalizedImage1Path));

    // Verify both images have the target dimensions
    const img1 = await readPNG(result.normalizedImage1Path);
    const img2 = await readPNG(result.normalizedImage2Path);

    expect(img1.width).toBe(1272);
    expect(img1.height).toBe(71);
    expect(img2.width).toBe(1272);
    expect(img2.height).toBe(71);
  });
});
