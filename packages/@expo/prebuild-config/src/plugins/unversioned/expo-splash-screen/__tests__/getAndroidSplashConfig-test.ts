import { getAndroidDarkSplashConfig, getAndroidSplashConfig } from '../getAndroidSplashConfig';

describe(getAndroidSplashConfig, () => {
  it(`uses the more specific splash`, () => {
    const config = getAndroidSplashConfig({
      splash: { backgroundColor: 'red', image: 'a' },
      android: { splash: { mdpi: 'b' } },
    });
    expect(config?.mdpi).toBe('b');
    // ensure the background color from the general splash config is not used if the android splash config is defined.
    expect(config?.backgroundColor).toBe(undefined);
  });

  it(`defaults the plugin splash image width to 100`, () => {
    const config = getAndroidSplashConfig({}, { image: 'a', resizeMode: 'contain' });

    expect(config?.imageWidth).toBe(100);
  });

  it(`defaults the android splash image width to 100`, () => {
    const config = getAndroidSplashConfig({
      android: { splash: { image: 'a' } },
    });

    expect(config?.imageWidth).toBe(100);
  });

  it(`defaults the root splash image width to 100`, () => {
    const config = getAndroidSplashConfig({
      splash: { image: 'a' },
    });

    expect(config?.imageWidth).toBe(100);
  });

  it(`preserves configured splash image width`, () => {
    expect(
      getAndroidSplashConfig({}, { image: 'a', imageWidth: 150, resizeMode: 'contain' })
        ?.imageWidth
    ).toBe(150);
    expect(
      getAndroidSplashConfig({
        android: { splash: { image: 'a', imageWidth: 150 } },
      })?.imageWidth
    ).toBe(150);
    expect(
      getAndroidSplashConfig({
        splash: { image: 'a', imageWidth: 150 },
      })?.imageWidth
    ).toBe(150);
  });
});
describe(getAndroidDarkSplashConfig, () => {
  it(`uses the dark config`, () => {
    const config = getAndroidDarkSplashConfig({
      splash: { backgroundColor: 'red', image: 'a' },
      android: { splash: { mdpi: 'b', dark: { image: 'c' } } },
    });
    expect(config?.mdpi).toBe('c');
    // ensure the background color from the general splash config is not used if the android splash config is defined.
    expect(config?.backgroundColor).toBe(undefined);
  });
});
