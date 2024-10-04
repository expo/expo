import * as babel from '@babel/core';

import preset from '..';
import { minifyLikeMetroAsync } from './minify-util';

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

it(`does not replace Platform.OS when assigning`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    Platform.OS = 'web';
  `;

  expect(babel.transform(sourceCode, options)!.code!).toEqual("Platform.OS='web';");
});

it(`does not replace EXPO_OS when assigning`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    process.env.EXPO_OS = 'web';
  `;

  expect(babel.transform(sourceCode, options)!.code!).toEqual("process.env.EXPO_OS='web';");
});

describe('global scoping', () => {
  // TODO: Maybe break this behavior and only allow Platform.OS if it's not a global.
  it(`removes Platform module without import (from global)`, () => {
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

    expect(babel.transform(sourceCode, options)!.code!).toEqual(`()=>console.log('web');`);
    // expect(babel.transform(sourceCode, options)!.code!).toEqual(
    //   `if(Platform.OS==='ios'){console.log('ios');}(function(){return console.log('web');});`
    // );
  });

  it(`does remove Platform["OS"] usage in globals`, () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };

    expect(babel.transform(`Platform["OS"]`, options)!.code!).toBe('"web";');
    // expect(babel.transform(`Platform["OS"]`, options)!.code!).toBe('Platform["OS"];');
  });
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

// This is different to default Metro behavior.
it(`does not remove React.Platform.OS module`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = ` 
    if (React.Platform.OS === 'ios') {
      console.log('ios')
    }
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(
    `if(React.Platform.OS==='ios'){console.log('ios');}`
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
    `()=>console.log('default');`
  );
});

// This behavior is different to React Native upstream.
it(`removes Platform["OS"] usage`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  expect(
    stripReactNativeImport(
      babel.transform(`import { Platform } from 'react-native';Platform["OS"]`, options)!.code!
    )
  ).toBe('"web";');

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform["OS"] === 'ios') {
      console.log('ios')
    }
    if ('web' === Platform["OS"]) {
      console.log('web')
    }
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).not.toMatch('ios');
  expect(code).not.toMatch('android');
  expect(code).not.toMatch('native');
});

it(`inlines Platform["OS"] in a switch statement but does not collapse the switch`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    switch (Platform["OS"]) {
      case 'ios':
        console.log('ios');
        break;
      case 'android':
        console.log('android');
        break;
      default:
        console.log('web');
        break;
    }
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).toMatch('ios');
});

it(`removes Platform module usage on web (expo-modules-core)`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'expo-modules-core';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
      native: () => console.log('native'),
      default: () => console.log('default'),
    })
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).not.toMatch('ios');
  expect(code).not.toMatch('android');
  expect(code).not.toMatch('native');
});

it(`does not use native option from Platform module on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
    
    Platform.select({
      native: () => console.log('ios'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(`undefined;`);
});

it(`removes Platform module and native fallback on web`, () => {
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
    `()=>console.log('default');`
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
    `()=>console.log('web');`
  );
});

// This behavior is different to React Native upstream.
it(`removes Platform["OS"] usage`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  expect(
    stripReactNativeImport(
      babel.transform(`import { Platform } from 'react-native';Platform["OS"]`, options)!.code!
    )
  ).toBe('"web";');

  const sourceCode = `
    import { Platform } from 'react-native';
  
    if (Platform["OS"] === 'ios') {
      console.log('ios')
    }
    if ('web' === Platform["OS"]) {
      console.log('web')
    }
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).not.toMatch('ios');
  expect(code).not.toMatch('android');
  expect(code).not.toMatch('native');
});

it(`inlines Platform["OS"] in a switch statement but does not collapse the switch`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
  
    switch (Platform["OS"]) {
      case 'ios':
        console.log('ios');
        break;
      case 'android':
        console.log('android');
        break;
      default:
        console.log('web');
        break;
    }
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).toMatch('ios');
});

it(`removes Platform module usage on web (expo-modules-core)`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'expo-modules-core';
  
    if (Platform.OS === 'ios') {
      console.log('ios')
    }
    
    Platform.select({
      ios: () => console.log('ios'),
      web: () => console.log('web'),
      android: () => console.log('android'),
      native: () => console.log('native'),
      default: () => console.log('default'),
    })
    `;

  const code = stripReactNativeImport(babel.transform(sourceCode, options)!.code!);
  expect(code).toMatch("console.log('web');");
  expect(code).not.toMatch('ios');
  expect(code).not.toMatch('android');
  expect(code).not.toMatch('native');
});

it(`does not use native option from Platform module on web`, () => {
  const options = {
    ...DEFAULT_OPTS,
    caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
  };

  const sourceCode = `
    import { Platform } from 'react-native';
    
    Platform.select({
      native: () => console.log('ios'),
    })
    `;

  expect(stripReactNativeImport(babel.transform(sourceCode, options)!.code!)).toEqual(`undefined;`);
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
  ).toEqual(`()=>console.log('android');`);

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
    `()=>console.log('android');`
  );
});

describe('__DEV__', () => {
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

  it('preserves __DEV__ in export alias', () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };

    const sourceCode = `
      const dev = true;
      export { dev as __DEV__ };
    `;

    // Ensure this doesn't throw
    expect(babel.transform(sourceCode, options)!.code!).toEqual(
      `Object.defineProperty(exports,"__esModule",{value:true});exports.__DEV__=undefined;const dev=exports.__DEV__=true;`
    );
  });

  it(`does not replace __DEV__ key in object`, () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };

    const sourceCode = `const x = { __DEV__: __DEV__ };`;
    expect(babel.transform(sourceCode, options)!.code!).toEqual(`const x={__DEV__:false};`);
  });

  it('preserves __DEV__ in an object shorthand method name', () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };

    const sourceCode = `
  const x = {
    __DEV__() { return __DEV__; },
  };
  `;
    expect(babel.transform(sourceCode, options)!.code!).toEqual(
      `const x={__DEV__(){return false;}};`
    );
  });

  it('preserves __DEV__ as the name of an optional property access', () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };
    const sourceCode = `
    x?.__DEV__;
    x?.__DEV__();
  `;

    expect(babel.transform(sourceCode, options)!.code!).toEqual(`x?.__DEV__;x?.__DEV__();`);
  });

  it('preserves __DEV__ as a label of a block statement', () => {
    const options = {
      ...DEFAULT_OPTS,
      caller: getCaller({ name: 'metro', engine: 'hermes', platform: 'web', isDev: false }),
    };
    const sourceCode = `
    __DEV__: {
      break __DEV__;
    };
  `;

    expect(babel.transform(sourceCode, options)!.code!).toEqual(`__DEV__:{break __DEV__;};`);
  });
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

  it(`preserves process.env.EXPO_SERVER usage in server bundles`, async () => {
    const options = {
      babelrc: false,
      presets: [preset],
      filename: 'unknown',
      // compact: true,
      // Make the snapshot easier to read
      retainLines: true,
      compact: true,
      caller: getCaller({ name: 'metro', platform: 'web', isDev: false, isServer: true }),
    };

    const src = `
    if (process.env.EXPO_SERVER) {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(true){');

    // Code is fully minified away
    expect((await minifyLikeMetroAsync(res!)).code).toBe(`console.log('ssr.1');`);
  });
  it(`removes process.env.EXPO_SERVER usage in client bundles`, async () => {
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
    if (process.env.EXPO_SERVER) {
      console.log('ssr.1');
    }
    `;

    const res = babel.transform(src, options);
    expect(res?.code).toMatch('if(false){');

    // Code is fully minified away
    expect((await minifyLikeMetroAsync(res!)).code).toBe(`0;`);
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
