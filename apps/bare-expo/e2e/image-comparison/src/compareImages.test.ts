import { afterAll, describe, expect, it } from 'bun:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { compareImages } from './compareImages';

const FIXTURES_DIR = path.join(__dirname, '../test-fixtures');

describe('compareImages', () => {
  const tempFiles: string[] = [];

  afterAll(async () => {
    // Clean up temp files
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it.each([
    { isNormalizationMode: false, description: 'without normalization' },
    { isNormalizationMode: true, description: 'with normalization' },
  ])(
    'should return 0% difference for identical images ($description)',
    async ({ isNormalizationMode }) => {
      const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
      const image2 = path.join(FIXTURES_DIR, 'red-400x225.png');

      const result = await compareImages({
        image1Path: image1,
        image2Path: image2,
        similarityThreshold: 5,
        isNormalizationMode,
      });

      expect(result.success).toBe(true);
      expect(result.diffPercentage).toBe(0);
      expect(result.diffPixels).toBe(0);
      expect(result.message).toContain('identical');
    }
  );

  it('should return success for similar images below threshold', async () => {
    const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
    const image2 = path.join(FIXTURES_DIR, 'blue-800x450.png');

    // These images have same aspect ratio but different sizes, so will fail without normalization
    // Let's use normalization mode to make them comparable
    const result = await compareImages({
      image1Path: image1,
      image2Path: image2,
      similarityThreshold: 100, // High threshold to ensure success
      isNormalizationMode: true,
    });

    expect(result.success).toBe(true);
    expect(result.diffPercentage).toBeGreaterThan(0);
    expect(result.message).toContain('similar');
  });

  it('should return failure for different images above threshold', async () => {
    const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
    const image2 = path.join(FIXTURES_DIR, 'blue-800x450.png');

    const result = await compareImages({
      image1Path: image1,
      image2Path: image2,
      similarityThreshold: 1, // Very low threshold
      isNormalizationMode: true,
    });

    expect(result.success).toBe(false);
    expect(result.diffPercentage).toBeGreaterThan(1);
    expect(result.message).toContain('significantly different');
  });

  it('should write diff image when outputPath is provided', async () => {
    const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
    const image2 = path.join(FIXTURES_DIR, 'blue-800x450.png');
    const outputPath = path.join(os.tmpdir(), `diff-test-${Date.now()}.png`);
    tempFiles.push(outputPath);

    const result = await compareImages({
      image1Path: image1,
      image2Path: image2,
      outputPath,
      isNormalizationMode: true,
    });

    expect(result.diffImagePath).toBe(outputPath);
    await fs.access(outputPath); // Should not throw if file exists
  });

  it('should normalize images with different dimensions in normalization mode', async () => {
    const image1 = path.join(FIXTURES_DIR, 'header-Appearance.android.png');
    const image2 = path.join(FIXTURES_DIR, 'header-Appearance.ios.png');

    const result = await compareImages({
      image1Path: image1,
      image2Path: image2,
      isNormalizationMode: true,
      similarityThreshold: 50, // Reasonable threshold for cross-platform
    });

    // Should succeed because normalization handles dimension differences
    expect(result.success).toBe(true);
    expect(result.totalPixels).toBeGreaterThan(0);
  });
});
