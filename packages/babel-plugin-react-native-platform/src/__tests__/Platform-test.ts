import { testCompressed, transform } from './utils';

it(`converts Platform.OS to a static value for Terser`, () => {
  const transpiledCode = transform(
    `
    const value = Platform.OS;
    `,
    {
      platform: `ios`,
    }
  );

  expect(transpiledCode).not.toMatch('Platform.OS');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`replaces Platform.select with the default value if no platform matches`, () => {
  const transpiledCode = transform(
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

  expect(transpiledCode).toMatch(/const value = {\s*test: true\s*}/);
  expect(transpiledCode).not.toMatch('Platform.select');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`replaces Platform.select with the value for the matching platform`, () => {
  const transpiledCode = transform(
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

  expect(transpiledCode).toMatch('const value = () => {};');
  expect(transpiledCode).not.toMatch('Platform.select');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`removes unmatched platforms but leaves Platform.select if other platforms may match at runtime`, () => {
  const transpiledCode = transform(
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

  expect(transpiledCode).toMatch('...defaults');
  expect(transpiledCode).toMatch('Platform.select');
  expect(transpiledCode).not.toMatch('ios');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`replaces Platform.select with "undefined" if no platforms match`, () => {
  const transpiledCode = transform(
    `
      const value = Platform.select({
        android: () => {},
      });
      `,
    {
      platform: 'ios',
    }
  );

  expect(transpiledCode).toEqual('const value = undefined;');
  testCompressed(transpiledCode);
});

it(`removes unmatched platforms but leaves Platform.select with indeterminate platforms`, () => {
  const transpiledCode = transform(
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

  expect(transpiledCode).toMatch("['andr' + 'oid']: () => {}");
  expect(transpiledCode).toMatch('Platform.select');
  expect(transpiledCode).not.toMatch('ios');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`removes unmatched platforms but leaves Platform.select with indeterminate platforms and the default case`, () => {
  const transpiledCode = transform(
    `
      const value = Platform.select({
        default: 'default',
        ['w' + 'eb']() {}
      });
      `,
    { platform: 'web' }
  );

  expect(transpiledCode).toMatch(`['w' + 'eb']() {}`);
  expect(transpiledCode).toMatch('Platform.select');
  expect(transpiledCode).toMatch(`default: 'default',`);
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});

it(`leaves Platform.select if the matching platform's value is a method`, () => {
  const transpiledCode = transform(
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

  expect(transpiledCode).toMatch('android() {}');
  expect(transpiledCode).toMatch('Platform.select');
  expect(transpiledCode).not.toMatch('ios');
  expect(transpiledCode).not.toMatch('web');
  expect(transpiledCode).toMatchSnapshot();
  testCompressed(transpiledCode);
});
