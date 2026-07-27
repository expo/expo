import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { getPngInfo } from '../Image';

beforeEach(() => {
  delete process.env.EXPO_IMAGE_UTILS_NO_SHARP;
});

// Test that the environment variable can be used to disable sharp for easier testing of image generation.
describe('isAvailableAsync', () => {
  it(`can be disabled using an environment variable`, async () => {
    process.env.EXPO_IMAGE_UTILS_NO_SHARP = '1';
    const { isAvailableAsync } = require('../sharp');
    expect(await isAvailableAsync()).toBe(false);
  });
});

describe('findSharpInstanceAsync', () => {
  it(`will throw an error if sharp is disabled in the environment`, async () => {
    process.env.EXPO_IMAGE_UTILS_NO_SHARP = '1';
    const { findSharpInstanceAsync } = require('../sharp');
    expect(findSharpInstanceAsync()).rejects.toThrow(
      'sharp has been disabled with the environment variable'
    );
  });
});

describe('sharpAsync', () => {
  it('resizes an image in-process', async () => {
    const { sharpAsync } = require('../sharp');
    const output = join(mkdtempSync(join(tmpdir(), 'image-utils-')), 'resized.png');

    await sharpAsync({ input: join(__dirname, 'assets/icon.png'), output }, [
      { operation: 'resize', width: 50, height: 50 },
    ]);

    expect(await getPngInfo(output)).toHaveProperty('width', 50);
  });
});
