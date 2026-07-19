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

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, resource);

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
    // Mirrors a family with a regular, an italic, and a bold face where each face only
    // specifies the properties that differ from the others.
    await Font.loadAsync([
      {
        fontFamily: name,
        fontDefinitions: [
          { path: 'regular.ttf' },
          { path: 'italic.ttf', style: 'italic' },
          { path: 'bold.ttf', weight: 800 },
        ],
      },
    ]);

    // All three faces must be registered; none should be skipped as an "already loaded"
    // duplicate of the shared `fontFamily` name.
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(3);
    // `weight`/`style`/`display` are never defaulted: forcing a value (e.g. `font-weight: 400`)
    // on a face that didn't specify one would incorrectly restrict a variable font file to a
    // single weight or style.
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(1, name, {
      uri: 'regular.ttf',
    });
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(2, name, {
      uri: 'italic.ttf',
      style: 'italic',
    });
    expect(ExpoFontLoader.loadAsync).toHaveBeenNthCalledWith(3, name, {
      uri: 'bold.ttf',
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
