import * as babel from '@babel/core';

import { minifyLikeMetroAsync } from './minify-util';
import preset from '..';

function getCaller(props: Record<string, string | boolean>): babel.TransformCaller {
  return props as unknown as babel.TransformCaller;
}

const DEFAULT_OPTS = {
  babelrc: false,
  presets: [[preset]],
  plugins: [
    // Fold constants to emulate Metro
    require('metro-transform-plugins/src/constant-folding-plugin.js'),
  ],
  sourceMaps: true,
  filename: 'unknown',
  configFile: false,
  compact: true,
  comments: false,
  retainLines: false,
};

function stripReactNativeImport(code: string) {
  return code
    .replace(
      'var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");var _Platform=_interopRequireDefault(require("react-native-web/dist/exports/Platform"));',
      ''
    )
    .replace('var _reactNative=require("react-native");', '');
}

it(`does not remove Platform module in development`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: true }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toMatch(
    /_Platform\.default\.OS===/
  );
});

it(`does not remove Platform module in development`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: true }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toMatch(
    /_Platform\.default\.OS===/
  );
});

it(`removes Platform module without import (undefined behavior)`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('web');});`
  );
});
it(`supports Platform module default fallback on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `      
    Platform.select({
      ios: () => console.log('ios'),
      default: () => console.log('default'),
    })`;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('default');});`
  );
});

xit(`removes Platform module and native fallback on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `      
    Platform.select({
      native: () => console.log('native'),
      default: () => console.log('default'),
    })`;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('web');});`
  );
});

it(`removes Platform module usage on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('web');});`
  );
});

it(`removes Platform module usage on native`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'android', isDev: false }),
  };

  expect(
    babel.transform(
      `Platform.select({ ios: () => console.log('ios'), web: () => console.log('web'), android: () => console.log('android'), })`,
      options
    )!.code
  ).toEqual(`(function(){return console.log('android');});`);

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `(function(){return console.log('android');});`
  );
});

it(`removes __DEV__ usage`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'android', isDev: false }),
  };

  const sourceCode = `  
    if (__DEV__) {
      require('./foobar')
    }
    `;

  // No minfication needed here, the babel plugin does it to ensure the imports are removed before dependencies are collected.
  expect(babel.transform(sourceCode, options)!.code!).toEqual(``);
});

describe('SSR window check', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  [true, false].forEach((isDev) => {
    ['development', 'test', 'production'].forEach((env) => {
      it(`inlines typeof window usage in NODE_ENV=${env} when bundling for servers with dev=${isDev}`, async () => {
        process.env.NODE_ENV = env;
        const options = {
          babelrc: false,
          presets: [preset],
          filename: 'unknown',
          // compact: true,
          // Make the snapshot easier to read
          retainLines: true,
          compact: true,
          caller: getCaller({ name: 'metro', platform: 'web', isDev, isServer: true }),
        };

        const src = `
        if (typeof window === 'undefined') {
          console.log('ssr.1');
        }
        if ("undefined" === typeof window) {
          console.log('ssr.2');
        }
        ("undefined" === typeof window) ? console.log('ssr.3') : undefined;
        `;

        const res = babel.transform(src, options);
        expect(res?.code).toMatch('if(true){');

        // Code is fully minified away
        expect((await minifyLikeMetroAsync(res!)).code).toBe(
          `console.log('ssr.1'),console.log('ssr.2'),console.log('ssr.3');`
        );
      });
    });
  });

  it(`preserves typeof window usage in client bundles`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'web', isDev: false, isServer: false }),
    };

    const src = `
    if (typeof window !== 'undefined') {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(true){');

    // Code is fully minified away
    expect((await minifyLikeMetroAsync(res!)).code).toBe(`console.log('ssr.1');`);
  });
  it(`preserves typeof window usage in client bundles`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'web', isDev: false, isServer: false }),
    };

    const src = `
    if (typeof window !== 'undefined') {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(true){');

    // Code is fully minified away
    expect((await minifyLikeMetroAsync(res!)).code).toBe(`console.log('ssr.1');`);
  });

  it(`preserves typeof window runtime check in native client bundles`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'ios', isDev: false, isServer: false }),
    };

    const src = `
    if (typeof window !== 'undefined') {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(typeof window');
  });
  it(`removes typeof window runtime check in native server bundles`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'ios', isDev: false, isServer: true }),
    };

    const src = `
    if (false) {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(false');
  });

  it(`supports disabling typeof window inline`, async () => {
    const options = {
      babelrc: false,
      presets: [[preset, { minifyTypeofWindow: false }]],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'android', isDev: false, isServer: false }),
    };

    const src = `
    if (typeof window !== 'undefined') {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('typeof window');
  });
});

describe('process.env.EXPO_OS', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  [true, false].forEach((isDev) => {
    ['development', 'test', 'production'].forEach((env) => {
      it(`inlines process.env.EXPO_OS usage in NODE_ENV=${env} when bundling for dev=${isDev}`, () => {
        process.env.NODE_ENV = env;
        const options = {
          babelrc: false,
          presets: [preset],
          filename: 'unknown',
          // Make the snapshot easier to read
          retainLines: true,
          caller: getCaller({ name: 'metro', platform: 'ios', isDev }),
        };

        expect(babel.transform('process.env.EXPO_OS', options)!.code).toBe('"ios";');
        expect(
          babel.transform('process.env.EXPO_OS', {
            ...options,
            caller: getCaller({ name: 'metro', platform: 'web', isDev }),
          })!.code
        ).toBe('"web";');
      });
    });
  });

  it(`can use process.env.EXPO_OS to minify`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'ios', isDev: false }),
    };

    const src = `
    if (process.env.EXPO_OS === 'ios') {
      console.log('ios');
    }
    `;

    const results = babel.transform(src, options)!;
    const min = await minifyLikeMetroAsync(results);
    expect(min.code).toBe("console.log('ios');");
  });

  it(`can use process.env.EXPO_OS to remove conditional`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'android', isDev: false }),
    };

    const src = `
    if (process.env.EXPO_OS === 'ios') {
      require('thing');
    }
    `;

    const results = babel.transform(src, options)!;
    const min = await minifyLikeMetroAsync(results);
    expect(min.code).toBe('0;');
  });
});

describe('process.env.EXPO_OS', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  [true, false].forEach((isDev) => {
    ['development', 'test', 'production'].forEach((env) => {
      it(`inlines process.env.EXPO_OS usage in NODE_ENV=${env} when bundling for dev=${isDev}`, () => {
        process.env.NODE_ENV = env;
        const options = {
          babelrc: false,
          presets: [preset],
          filename: 'unknown',
          // Make the snapshot easier to read
          retainLines: true,
          caller: getCaller({ name: 'metro', platform: 'ios', isDev }),
        };

        expect(babel.transform('process.env.EXPO_OS', options)!.code).toBe('"ios";');
        expect(
          babel.transform('process.env.EXPO_OS', {
            ...options,
            caller: getCaller({ name: 'metro', platform: 'web', isDev }),
          })!.code
        ).toBe('"web";');
      });
    });
  });

  it(`can use process.env.EXPO_OS to minify`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // Make the snapshot easier to read
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'ios', isDev: false }),
    };

    const src = `
    if (process.env.EXPO_OS === 'ios') {
      console.log('ios');
    }
    `;

    const results = babel.transform(src, options)!;
    const min = await minifyLikeMetroAsync(results);
    expect(min.code).toBe("console.log('ios');");
  });
});
