import { transformSync } from '@babel/core';
// @ts-ignore
import dedent from 'dedent';
import universalPlatform, { Options } from '..';

function transform(input: string, options: Options): string {
  const value = transformSync(dedent(input), {
    plugins: [[universalPlatform, options]],
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
// Terser should shake it during the bundling.
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
// Terser should shake it during the bundling.
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

it(`switch statement is converted for Terser`, () => {
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

describe('if Statements', () => {
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

describe('Platform.OS', () => {
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

describe('Platform.select', () => {
  it('should replace Platform.select with value for default case if there is no matching platform', () => {
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

  it('should replace Platform.select with value for matching platform', () => {
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

  it('should remove non-matching platforms but leave Platform.select', () => {
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

  it('should replace Platform.select with undefined if no cases are matching', () => {
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

  it('should remove non-matching platforms but leave Platform.select with unknown cases 1', () => {
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

  it('should remove non-matching platforms but leave Platform.select with unknown cases and default case', () => {
    const code = transform(
      `
      const value = Platform.select({
        default: 'default',
        ['w' + 'eb']() {}
      });
      `,
      { platform: 'web', mode: 'development' }
    );

    expect(code).toMatch("['w' + 'eb']() {}");
    expect(code).toMatch('Platform.select');
    expect(code).toMatch("default: 'default',");
    expect(code).toMatchSnapshot();
  });

  it('should remove non-matching platforms but leave Platform.select with method', () => {
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
