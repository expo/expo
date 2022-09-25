import { getAndroidDarkSplashConfig, getAndroidSplashConfig } from '../getAndroidSplashConfig';

describe(getAndroidSplashConfig, () => {
  it(`uses the more specific splash`, () => {
    const config = getAndroidSplashConfig({
      splash: { backgroundColor: 'red', image: 'a' },
      android: { splash: { mdpi: 'b' } },
    });
    expect(config.mdpi).toBe('b');
    // ensure the background color from the general splash config is not used if the android splash config is defined.
    expect(config.backgroundColor).toBe(null);
  });
});
describe(getAndroidDarkSplashConfig, () => {
  it(`uses the dark config`, () => {
    const config = getAndroidDarkSplashConfig({
      splash: { backgroundColor: 'red', image: 'a' },
      android: { splash: { mdpi: 'b', dark: { image: 'c' } } },
    });
    expect(config.mdpi).toBe('c');
    // ensure the background color from the general splash config is not used if the android splash config is defined.
    expect(config.backgroundColor).toBe(null);
  });
});
