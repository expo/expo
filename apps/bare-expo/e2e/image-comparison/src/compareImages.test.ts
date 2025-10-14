import { afterAll, describe, expect, it } from 'bun:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { compareImages } from './compareImages';

const FIXTURES_DIR = path.join(__dirname, '../test-fixtures');

describe(compareImages, () => {
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

  describe('comparison should return', () => {
    it.each([
      { isNormalizationMode: false, description: 'without normalization' },
      { isNormalizationMode: true, description: 'with normalization' },
    ])('0% difference for identical images ($description)', async ({ isNormalizationMode }) => {
      const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
      const image2 = path.join(FIXTURES_DIR, 'red-400x225.png');

      const result = await compareImages({
        image1Path: image1,
        image2Path: image2,
        similarityThreshold: 0.05,
        isNormalizationMode,
      });

      expect(result.success).toBe(true);
      expect(result.diffRatio).toBe(0);
      expect(result.diffPixels).toBe(0);
      expect(result.message).toContain('identical');
    });

    it('failure for different images above threshold', async () => {
      const image1 = path.join(FIXTURES_DIR, 'red-400x225.png');
      const image2 = path.join(FIXTURES_DIR, 'blue-800x450.png');

      const result = await compareImages({
        image1Path: image1,
        image2Path: image2,
        similarityThreshold: 0.1,
        isNormalizationMode: true,
      });

      expect(result.success).toBe(false);
      expect(result.diffRatio).toBeGreaterThan(0.01);
    });

    it('success for images with different dimensions in normalization mode', async () => {
      const image1 = path.join(FIXTURES_DIR, 'header-Appearance.android.png');
      const image2 = path.join(FIXTURES_DIR, 'header-Appearance.ios.png');

      const result = await compareImages({
        image1Path: image1,
        image2Path: image2,
        isNormalizationMode: true,
        similarityThreshold: 0.1,
      });

      expect(result.success).toBe(true);
    });
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

    await fs.access(outputPath);
    expect(result.diffImagePath).toBe(outputPath);
  });
});
