import { getExtensions, getLanguageExtensionsInOrder, getManagedExtensions } from '../extensions';

describe('getExtensions', () => {
  it(`enforces \`string[]\``, async () => {
    expect(() => getExtensions('web')).toThrow(`string[]`);
    expect(() => getExtensions([], 'js')).toThrow(`string[]`);
    expect(() => getExtensions([], [], 'expo')).toThrow(`string[]`);
    expect(() => getExtensions([], null, [])).toThrow(`string[]`);
  });
});

describe('getManagedExtensions', () => {
  it(`creates extensions for web`, async () => {
    expect(getManagedExtensions(['web'])).toMatchSnapshot();
  });

  it(`creates extensions for iOS`, async () => {
    expect(getManagedExtensions(['ios', 'native'])).toMatchSnapshot();
  });
});

// Enforce that all extensions are returned in the correct order, this is very important!
describe('getLanguageExtensionsInOrder', () => {
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
