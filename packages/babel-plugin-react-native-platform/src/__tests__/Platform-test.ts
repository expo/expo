import { testCompressed, transform } from './utils';

it(`converts Platform.OS to a static value for Terser`, () => {
  const code = transform(
    `
    const value = Platform.OS;
    `,
    {
      platform: `ios`,
    }
  );

  expect(code).not.toMatch('Platform.OS');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`skips non-matching RNPlatform.OS`, () => {
  const code = transform(
    `
    const value = RNPlatform.OS;
    `,
    {
      platform: `ios`,
    }
  );

  expect(code).toMatch('const value = RNPlatform.OS;');
  testCompressed(code);
});

it(`replaces Platform.select with the default value if no platform matches`, () => {
  const code = transform(
    `
      const value = Platform.select({
        android: 'android',
        ios: () => {},
        default: { test: true },
        web: 'what?'
      });
      `,
    {
      platform: 'custom',
    }
  );

  expect(code).toMatch(/const value = {\s*test: true\s*}/);
  expect(code).not.toMatch('Platform.select');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`replaces Platform.select with the value for the matching platform`, () => {
  const code = transform(
    `
      const defaults = { default: 'default' };
      const value = Platform.select({
        ios: () => {},
        ...defaults,
      });
      `,
    {
      platform: 'ios',
    }
  );

  expect(code).toMatch('const value = () => {};');
  expect(code).not.toMatch('Platform.select');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`removes unmatched platforms but leaves Platform.select if other platforms may match at runtime`, () => {
  const code = transform(
    `
      const defaults = { default: 'default' };
      const value = Platform.select({
        ios: () => {},
        ...defaults,
      });
      `,
    {
      platform: 'android',
    }
  );

  expect(code).toMatch('...defaults');
  expect(code).toMatch('Platform.select');
  expect(code).not.toMatch('ios');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`replaces Platform.select with "undefined" if no platforms match`, () => {
  const code = transform(
    `
      const value = Platform.select({
        android: () => {},
      });
      `,
    {
      platform: 'ios',
    }
  );

  expect(code).toEqual('const value = undefined;');
  testCompressed(code);
});

it(`removes unmatched platforms but leaves Platform.select with indeterminate platforms`, () => {
  const code = transform(
    `
      const value = Platform.select({
        ios: false,
        ['andr' + 'oid']: () => {},
      });
      `,
    {
      platform: 'android',
    }
  );

  expect(code).toMatch("['andr' + 'oid']: () => {}");
  expect(code).toMatch('Platform.select');
  expect(code).not.toMatch('ios');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`removes unmatched platforms but leaves Platform.select with indeterminate platforms and the default case`, () => {
  const code = transform(
    `
      const value = Platform.select({
        default: 'default',
        ['w' + 'eb']() {}
      });
      `,
    { platform: 'web' }
  );

  expect(code).toMatch(`['w' + 'eb']() {}`);
  expect(code).toMatch('Platform.select');
  expect(code).toMatch(`default: 'default',`);
  expect(code).toMatchSnapshot();
  testCompressed(code);
});

it(`leaves Platform.select if the matching platform's value is a method`, () => {
  const code = transform(
    `
      const value = Platform.select({
        ios: false,
        android() {},
        web: false,
      });
      `,
    {
      platform: 'android',
    }
  );

  expect(code).toMatch('android() {}');
  expect(code).toMatch('Platform.select');
  expect(code).not.toMatch('ios');
  expect(code).not.toMatch('web');
  expect(code).toMatchSnapshot();
  testCompressed(code);
});
