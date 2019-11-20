import { mockProperty, unmockAllProperties } from 'jest-expo';

let Font: any;

let ExpoFontLoader: any;

beforeEach(() => {
  Font = require('../Font');
  ExpoFontLoader = require('../ExpoFontLoader').default;

  mockProperty(
    ExpoFontLoader,
    'loadAsync',
    jest.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    })
  );
  mockProperty(
    ExpoFontLoader,
    'unloadAsync',
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

  await Font.unloadAsync(name);
  expect(Font.isLoaded(name)).toBe(false);
});

it(`rejects unloading fonts if the font hasn't finished loading yet.`, async () => {
  const name = 'foobar';

  // Load font in sync
  Font.loadAsync(name, { uri: 'foo.ttf' });
  // Check to ensure it's loading
  expect(Font.isLoading(name)).toBe(true);
  // Attempting to unload all should throw an error
  await expect(Font.unloadAllAsync()).rejects.toThrow('still loading');
  // Wait until the font finished loading
  await new Promise(resolve => setTimeout(resolve, 6));
  // Should still be loaded because unloadAll was invoked too early.
  expect(Font.isLoaded(name)).toBe(true);
  expect(Font.isLoading(name)).toBe(false);
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
