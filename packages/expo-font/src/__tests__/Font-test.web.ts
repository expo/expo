import { mockProperty, unmockAllProperties } from 'jest-expo';

let Font: any;

let ExpoFontLoader: any;

describe('loadAsync', () => {
  beforeEach(() => {
    Font = require('../Font');
    ExpoFontLoader = require('../ExpoFontLoader').default;

    mockProperty(
      ExpoFontLoader,
      'loadAsync',
      jest.fn(async () => {})
    );
  });

  afterEach(() => {
    unmockAllProperties();
    jest.resetModules();
  });

  it(`works without map`, async () => {
    const name = 'foobar';
    const resource = { uri: 'font.ttf' };

    expect(Font.isLoaded(name)).toBe(false);

    setTimeout(() => {
      expect(Font.isLoading(name)).toBe(true);
    }, 1);

    await Font.loadAsync(name, resource);

    expect(Font.isLoaded(name)).toBe(true);

    expect(Font.isLoading(name)).toBe(false);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      ...resource,
      display: Font.FontDisplay.AUTO,
    });
  });

  it(`parses map`, async () => {
    const name = 'foobar';
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
    const name = 'foobar';
    const resource = { localUri: 'font.ttf', uri: 'font.ttf', downloadAsync() {}, name: 'font' };

    await Font.loadAsync(name, resource);

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      display: Font.FontDisplay.AUTO,
      uri: 'font.ttf',
    });
  });

  it(`passes display to native method`, async () => {
    const name = 'foobar';

    await Font.loadAsync(name, { uri: 'foobar.ttf', display: Font.FontDisplay.OPTIONAL });

    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledTimes(1);
    expect(ExpoFontLoader.loadAsync).toHaveBeenCalledWith(name, {
      display: Font.FontDisplay.OPTIONAL,
      uri: 'foobar.ttf',
    });
  });
});
