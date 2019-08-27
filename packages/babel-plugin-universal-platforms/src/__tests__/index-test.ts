import { transformSync } from '@babel/core';
// @ts-ignore
import dedent from 'dedent';
import universalPlatformPlugin, { UniversalPlatformPluginOptions } from '..';

function transform(input: string, options: UniversalPlatformPluginOptions): string {
  const value = transformSync(dedent(input), {
    plugins: [[universalPlatformPlugin, options]],
    babelrc: false,
    configFile: false,
  });

  return value == null ? '' : (value.code as string);
}

it(`removes __DEV__ and process.env.NODE_ENV`, () => {
  const code = transform(
    `
  if (__DEV__) {
    console.log("DEV MODE")
  } else {
    console.log("PROD MODE")
  }
  if (process.env.NODE_ENV === 'development') {
    console.log("DEV MODE")
  } else {
    console.log("PROD MODE")
  }
  `,
    {
      platform: `ios`,
      mode: 'development',
    }
  );

  expect(code).toMatch('DEV');
  expect(code).not.toMatch('PROD');
  expect(code).toMatchSnapshot();
});

// react-native-web redefines this value.
// Terser should remove it during the bundling.
it(`keeps __DEV__ redefinition`, () => {
  const code = transform(
    `
  const __DEV__ = process.env.NODE_ENV !== 'production';
  `,
    {
      platform: `web`,
      mode: 'development',
    }
  );

  expect(code).toMatch('__DEV__');
  expect(code).not.toMatch('process.env.NODE_ENV');
});

// react-native-web redefines this value.
// Terser should remove it during the bundling.
it(`should pass over process.env.NODE_ENV redefinition`, () => {
  const code = transform(
    `
  process.env.NODE_ENV = 'production';
  `,
    {
      platform: `web`,
      mode: 'development',
    }
  );
  expect(code).toMatch(`process.env.NODE_ENV = 'production'`);
});

it(`converts switch-statement predicates for Terser`, () => {
  const code = transform(
    `
    switch (Platform.OS) {
      case 'web':
        console.log('web');
        break;
      default:
        console.log('default');
        break;
    }
  `,
    {
      platform: `web`,
      mode: 'development',
    }
  );
  expect(code).toMatch('switch ("web")');
});

describe(`if statements`, () => {
  const DEFAULT_BLOCK = `
  if (Platform.OS === 'ios') {
    console.log('iOS')
  } else if (Platform.OS == "android") {
    console.log('Android')
  } else if ("web" === Platform.OS) {
    console.log('web')
  } else {
    console.log('and beyond')
  }
  `;

  for (const platform of ['iOS', 'Android', 'web', 'custom']) {
    it(`only saves ${platform} code`, () => {
      const code = transform(DEFAULT_BLOCK, {
        platform: platform.toLowerCase(),
        mode: 'development',
      });

      expect(code).not.toMatch('Platform.OS');
      expect(code).toMatchSnapshot();
    });
  }
});

describe(`Platform.OS`, () => {
  it(`is converted to a static value for Terser`, () => {
    const code = transform(
      `
    const value = Platform.OS;
    `,
      {
        platform: `ios`,
        mode: 'development',
      }
    );

    expect(code).not.toMatch('Platform.OS');
    expect(code).toMatchSnapshot();
  });
});

describe(`Platform.select`, () => {
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
        mode: 'development',
      }
    );

    expect(code).toMatch(/const value = {\s*test: true\s*}/);
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
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
        mode: 'development',
      }
    );

    expect(code).toMatch('const value = () => {};');
    expect(code).not.toMatch('Platform.select');
    expect(code).toMatchSnapshot();
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
        mode: 'development',
      }
    );

    expect(code).toMatch('...defaults');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
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
        mode: 'development',
      }
    );

    expect(code).toEqual('const value = undefined;');
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
        mode: 'development',
      }
    );

    expect(code).toMatch("['andr' + 'oid']: () => {}");
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).toMatchSnapshot();
  });

  it(`removes unmatched platforms but leaves Platform.select with indeterminate platforms and the default case`, () => {
    const code = transform(
      `
      const value = Platform.select({
        default: 'default',
        ['w' + 'eb']() {}
      });
      `,
      { platform: 'web', mode: 'development' }
    );

    expect(code).toMatch(`['w' + 'eb']() {}`);
    expect(code).toMatch('Platform.select');
    expect(code).toMatch(`default: 'default',`);
    expect(code).toMatchSnapshot();
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
        mode: 'development',
      }
    );

    expect(code).toMatch('android() {}');
    expect(code).toMatch('Platform.select');
    expect(code).not.toMatch('ios');
    expect(code).not.toMatch('web');
    expect(code).toMatchSnapshot();
  });
});
