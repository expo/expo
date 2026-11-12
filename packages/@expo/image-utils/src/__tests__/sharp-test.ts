beforeEach(() => {
  delete process.env.EXPO_IMAGE_UTILS_NO_SHARP;
});

// Test that the environment variable can be used to disable sharp-cli for easier testing of image generation.
describe('isAvailableAsync', () => {
  it(`can be disabled using an environment variable`, async () => {
    process.env.EXPO_IMAGE_UTILS_NO_SHARP = '1';
    const { isAvailableAsync } = require('../sharp');
    expect(await isAvailableAsync()).toBe(false);
  });
});
describe('findSharpInstanceAsync', () => {
  it(`will throw an error if sharp-cli is disabled in the environment`, async () => {
    process.env.EXPO_IMAGE_UTILS_NO_SHARP = '1';
    const { findSharpInstanceAsync } = require('../sharp');
    expect(findSharpInstanceAsync()).rejects.toThrow(
      'sharp-cli has been disabled with the environment variable'
    );
  });
});

describe('isAvailableAsync with sharp-cli installed', () => {
  it(`detects the sharp instance resolved from the sharp-cli package`, async () => {
    jest.resetModules();
    const { isAvailableAsync, findSharpInstanceAsync } = require('../sharp');

    expect(await isAvailableAsync()).toBe(true);
    const sharp = await findSharpInstanceAsync();
    expect(typeof sharp.versions.vips).toBe('string');
  });
});
