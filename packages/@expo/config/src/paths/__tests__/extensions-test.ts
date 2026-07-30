import {
  getExtensions,
  getBareExtensions,
  getLanguageExtensionsInOrder,
  getPlatformExtensions,
} from '../extensions';

describe(getExtensions, () => {
  it(`enforces \`string[]\``, async () => {
    // @ts-expect-error: test invalid input
    expect(() => getExtensions('web')).toThrow(`string[]`);
    // @ts-expect-error: test invalid input
    expect(() => getExtensions([], 'js')).toThrow(`string[]`);
    // @ts-expect-error: test invalid input
    expect(() => getExtensions([], [], 'expo')).toThrow(`string[]`);
    // @ts-expect-error: test invalid input
    expect(() => getExtensions([], null, [])).toThrow(`string[]`);
  });
});

describe(getBareExtensions, () => {
  it(`creates extensions for web`, async () => {
    expect(getBareExtensions(['web'])).toMatchSnapshot();
  });

  it(`creates extensions for iOS`, async () => {
    expect(getBareExtensions(['ios', 'native'])).toMatchSnapshot();
  });
});

describe(getPlatformExtensions, () => {
  it(`expands a platform's extensions in order with platform-less last`, () => {
    expect(getPlatformExtensions('tvos', ['js', 'ts'])).toStrictEqual([
      'tvos.js',
      'tvos.ts',
      'ios.js',
      'ios.ts',
      'native.js',
      'native.ts',
      'js',
      'ts',
    ]);
  });

  it(`returns null for platforms without a custom order`, () => {
    expect(getPlatformExtensions('ios', ['js'])).toBeNull();
  });

  it(`expands windows extensions, falling back to native (no ios/apple fallback)`, () => {
    expect(getPlatformExtensions('windows', ['js', 'ts'])).toStrictEqual([
      'windows.js',
      'windows.ts',
      'native.js',
      'native.ts',
      'js',
      'ts',
    ]);
  });
});

// Enforce that all extensions are returned in the correct order, this is very important!
describe(getLanguageExtensionsInOrder, () => {
  // Return only support for the bare minimum
  it(`JS only`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: false, isModern: false, isReact: false })
    ).toStrictEqual(['js']);
  });

  // Modern should come before JS in a basic MJS project
  it(`Modern JS`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: false, isModern: true, isReact: false })
    ).toStrictEqual(['mjs', 'js']);
  });

  // TypeScript should precede JavaScript
  it(`TypeScript`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: true, isModern: false, isReact: false })
    ).toStrictEqual(['ts', 'js']);
  });

  // JS should precede JSX files
  it(`React`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: false, isModern: false, isReact: true })
    ).toStrictEqual(['js', 'jsx']);
  });

  // Modern should come before JS in a basic MJS project
  it(`TypeScript React`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: true, isModern: false, isReact: true })
    ).toStrictEqual(['ts', 'tsx', 'js', 'jsx']);
  });

  // Should include all extensions in the correct order
  it(`Modern TypeScript React`, async () => {
    expect(
      getLanguageExtensionsInOrder({ isTS: true, isModern: true, isReact: true })
    ).toStrictEqual(['ts', 'tsx', 'mjs', 'js', 'jsx']);
  });
});
