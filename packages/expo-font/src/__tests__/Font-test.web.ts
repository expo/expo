import { unmockAllProperties } from 'jest-expo';

import ExpoFontLoader from '../ExpoFontLoader';
import * as Font from '../index';

jest.mock('../ExpoFontLoader.web', () => {
  const mod = jest.requireActual('../../mocks/ExpoFontLoader');
  return {
    ...mod,
  };
});

afterEach(async () => {
  unmockAllProperties();
  jest.resetModules();
  await Font.unloadAllAsync();
});
const name = 'foo bar';

if (typeof window === 'undefined') {
  it(`noop`, async () => {});
} else {
  it(`works without map`, async () => {
    const resource = { uri: 'font.ttf' };

    expect(Font.isLoaded(name)).toBe(false);

    await Font.loadAsync(name, resource);

    expect(Font.isLoaded(name)).toBe(true);

    expect(Font.isLoading(name)).toBe(false);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      ...resource,
      display: Font.FontDisplay.AUTO,
    });

    await Font.unloadAsync(name);
    expect(Font.isLoaded(name)).toBe(false);
  });

  it(`rejects unloading fonts if the font hasn't finished loading yet.`, async () => {
    // Load font in sync
    const loadPromise = Font.loadAsync(name, { uri: 'foo.ttf' });
    // Check to ensure it's loading
    expect(Font.isLoading(name)).toBe(true);
    // Attempting to unload all should throw an error
    await expect(Font.unloadAllAsync()).rejects.toThrow('still loading');
    // Wait until the font finished loading
    await loadPromise;
    // Should still be loaded because unloadAll was invoked too early.
    expect(Font.isLoaded(name)).toBe(true);
    expect(Font.isLoading(name)).toBe(false);
  });

  it(`parses map`, async () => {
    const resource = { uri: 'font.ttf' };

    const map = {
      [name]: resource,
      barfoo1: 'font.ttf',
    };

    await Font.loadAsync(map);

    for (const key of Object.keys(map)) {
      expect(Font.isLoaded(key)).toBe(true);
      expect(Font.isLoading(key)).toBe(false);
    }

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(Object.keys(map).length);
  });

  it(`parses asset`, async () => {
    const resource = { localUri: 'font.ttf', uri: 'font.ttf', downloadAsync() {}, name: 'font' };

    await Font.loadAsync(name, resource);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      display: Font.FontDisplay.AUTO,
      uri: 'font.ttf',
    });
  });

  it(`passes display to native method`, async () => {
    await Font.loadAsync(name, { uri: 'foobar.ttf', display: Font.FontDisplay.OPTIONAL });

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      display: Font.FontDisplay.OPTIONAL,
      uri: 'foobar.ttf',
    });
  });

  it('getLoadedFonts is available', () => {
    expect(Font.getLoadedFonts()).toHaveLength(0);
  });

  it('parses an array of font family definitions, loading every face', async () => {
    await Font.loadAsync([
      {
        fontFamily: name,
        fontDefinitions: [
          { path: 'regular.ttf', weight: 400 },
          { path: 'italic.ttf', weight: 400, style: 'italic' },
          { path: 'bold.ttf', weight: 800 },
        ],
      },
    ]);

    // All three faces must be registered; none should be skipped as an "already loaded"
    // duplicate of the shared `fontFamily` name.
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(3);
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(1, name, {
      uri: 'regular.ttf',
      display: Font.FontDisplay.AUTO,
      weight: 400,
    });
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(2, name, {
      uri: 'italic.ttf',
      display: Font.FontDisplay.AUTO,
      weight: 400,
      style: 'italic',
    });
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(3, name, {
      uri: 'bold.ttf',
      display: Font.FontDisplay.AUTO,
      weight: 800,
    });

    expect(Font.isLoaded(name)).toBe(true);
    expect(Font.isLoading(name)).toBe(false);
  });

  it('does not reload a face that was already loaded via the array API', async () => {
    const definition = {
      fontFamily: name,
      fontDefinitions: [{ path: 'regular.ttf', weight: 400 }],
    };

    await Font.loadAsync([definition]);
    await Font.loadAsync([definition]);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
  });
}
