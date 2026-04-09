import { getAndroidDarkSplashConfig, getAndroidSplashConfig } from '../getAndroidSplashConfig';

describe(getAndroidSplashConfig, () => {
  it(`uses the provided splash config directly`, () => {
    const config = getAndroidSplashConfig({
      mdpi: 'b',
      resizeMode: 'contain',
    });
    expect(config.mdpi).toBe('b');
    // resizeMode defaults to contain when not provided
    expect(config.resizeMode).toBe('contain');
  });
});
describe(getAndroidDarkSplashConfig, () => {
  it(`uses the dark config`, () => {
    const config = getAndroidDarkSplashConfig({
      mdpi: 'b',
      resizeMode: 'contain',
      dark: { image: 'c' },
    });
    expect(config?.mdpi).toBe('c');
    // resizeMode defaults to contain when not provided
    expect(config?.resizeMode).toBe('contain');
  });
});
