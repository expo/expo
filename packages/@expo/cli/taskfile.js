const { boolish } = require('getenv');
const path = require('path');
const process = require('process');
import fs from 'fs';

export async function bin(task, opts) {
  await task
    .source(opts.src || 'bin/*')
    .swc('cli', { stripExtension: true, dev: opts.dev })
    .target('build/bin', { mode: '0755' });
}

export async function cli(task, opts) {
  await task
    .source('src/**/*.+(js|ts)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('cli', { dev: opts.dev })
    .target('build/src');
}

export async function build(task, opts) {
  await task.parallel(['cli', 'bin'], opts);
}

// Prebuilt modules

export async function compile_expo_modules_core(task, opts) {
  const rnDir = path.join(require.resolve('expo-modules-core/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|ts|tsx)';

  const out = 'dist/compiled/expo-modules-core/_temp-ios';
  await task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: 'expo-modules-core',
      externals: {
        invariant: 'invariant',
        react: 'react',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react-native': '@expo/cli/dist/compiled/react-native',

        ...BABEL_EXTERNALS,
      },
      target: 'es5',
      minify: false,
    })
    .rename('index.ios.js')
    .target('dist/compiled/expo-modules-core');
}

export async function compile__react_native_virtualized_lists(task, opts) {
  const rnDir = path.join(require.resolve('@react-native/virtualized-lists/package.json'), '..');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**', '**/__flowtests__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .target('dist/compiled/@react-native/virtualized-lists');
}

export async function compile_metro_runtime(task, opts) {
  const rnDir = path.join(require.resolve('metro-runtime/package.json'), '..');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**', '**/__flowtests__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .target('dist/compiled/metro-runtime');
}
export async function compile_pretty_format(task, opts) {
  const rnDir = path.join(require.resolve('pretty-format/package.json'), '../build');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**', '**/__flowtests__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .target('dist/compiled/pretty-format');
}

export async function compile_deprecated_react_native_prop_types(task, opts) {
  const moduleId = 'deprecated-react-native-prop-types';
  const externals = {
    '@react-native/normalize-colors': '@react-native/normalize-colors',
    'prop-types': 'prop-types',
  };

  const rnDir = path.join(require.resolve(moduleId + '/package.json'), '../');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|ts|tsx)';

  const out = `dist/compiled/${moduleId}/_temp-ios`;
  return task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: moduleId,
      externals: {
        invariant: 'invariant',
        react: 'react',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react-native': '@expo/cli/dist/compiled/react-native',
        'react-native/Libraries/Utilities/codegenNativeComponent':
          '@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent',

        ...BABEL_EXTERNALS,
        ...externals,
      },
      target: 'es5',
      minify: true,
    })
    .rename('index.ios.js')
    .target('dist/compiled/' + moduleId);
}

const BABEL_EXTERNALS = {
  '@babel/runtime/helpers/interopRequireDefault': '@babel/runtime/helpers/interopRequireDefault',
  '@babel/runtime/helpers/classCallCheck': '@babel/runtime/helpers/classCallCheck',
  '@babel/runtime/helpers/createClass': '@babel/runtime/helpers/createClass',
  '@babel/runtime/helpers/inherits': '@babel/runtime/helpers/inherits',
  '@babel/runtime/helpers/possibleConstructorReturn':
    '@babel/runtime/helpers/possibleConstructorReturn',
  '@babel/runtime/helpers/getPrototypeOf': '@babel/runtime/helpers/getPrototypeOf',
  '@babel/runtime/helpers/toPropertyKey': '@babel/runtime/helpers/toPropertyKey',
  '@babel/runtime/helpers/typeof': '@babel/runtime/helpers/typeof',
  '@babel/runtime/helpers/toPrimitive': '@babel/runtime/helpers/toPrimitive',
  '@babel/runtime/helpers/setPrototypeOf': '@babel/runtime/helpers/setPrototypeOf',
  '@babel/runtime/helpers/assertThisInitialized': '@babel/runtime/helpers/assertThisInitialized',
  '@babel/runtime/helpers/slicedToArray': '@babel/runtime/helpers/slicedToArray',
  '@babel/runtime/helpers/arrayWithHoles': '@babel/runtime/helpers/arrayWithHoles',
  '@babel/runtime/helpers/iterableToArrayLimit': '@babel/runtime/helpers/iterableToArrayLimit',
  '@babel/runtime/helpers/unsupportedIterableToArray':
    '@babel/runtime/helpers/unsupportedIterableToArray',
  '@babel/runtime/helpers/arrayLikeToArray': '@babel/runtime/helpers/arrayLikeToArray',
  '@babel/runtime/helpers/nonIterableRest': '@babel/runtime/helpers/nonIterableRest',
  '@babel/runtime/helpers/toConsumableArray': '@babel/runtime/helpers/toConsumableArray',
  '@babel/runtime/helpers/arrayWithoutHoles': '@babel/runtime/helpers/arrayWithoutHoles',
  '@babel/runtime/helpers/iterableToArray': '@babel/runtime/helpers/iterableToArray',
  '@babel/runtime/helpers/nonIterableSpread': '@babel/runtime/helpers/nonIterableSpread',
  '@babel/runtime/helpers/wrapNativeSuper': '@babel/runtime/helpers/wrapNativeSuper',
  '@babel/runtime/helpers/isNativeFunction': '@babel/runtime/helpers/isNativeFunction',
  '@babel/runtime/helpers/construct': '@babel/runtime/helpers/construct',
  '@babel/runtime/helpers/isNativeReflectConstruct':
    '@babel/runtime/helpers/isNativeReflectConstruct',
  '@babel/runtime/helpers/asyncToGenerator': '@babel/runtime/helpers/asyncToGenerator',
  '@babel/runtime/helpers/get': '@babel/runtime/helpers/get',
  '@babel/runtime/helpers/superPropBase': '@babel/runtime/helpers/superPropBase',
  '@babel/runtime/helpers/objectWithoutProperties':
    '@babel/runtime/helpers/objectWithoutProperties',
  '@babel/runtime/helpers/objectWithoutPropertiesLoose':
    '@babel/runtime/helpers/objectWithoutPropertiesLoose',
  '@babel/runtime/helpers/defineProperty': '@babel/runtime/helpers/defineProperty',
  '@babel/runtime/helpers/toArray': '@babel/runtime/helpers/toArray',
  '@babel/runtime/helpers/extends': '@babel/runtime/helpers/extends',
};

export async function compile_react_navigation_core(task, opts) {
  const moduleId = '@react-navigation/core';
  const externals = {
    'prop-types': 'prop-types',

    '@react-navigation/routers': '@react-navigation/routers',
    'escape-string-regexp': 'escape-string-regexp',
    nanoid: 'nanoid',
    'nanoid/non-secure': 'nanoid/non-secure',
    'query-string': 'query-string',
    'react-is': 'react-is',
    'use-latest-callback': 'use-latest-callback',
  };

  const rnDir = path.join(require.resolve(moduleId + '/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|ts|tsx)';

  const out = `dist/compiled/${moduleId}/_temp-ios`;
  return task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: moduleId,
      externals: {
        invariant: 'invariant',
        react: 'react',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react-native': '@expo/cli/dist/compiled/react-native',
        'react-native/Libraries/Utilities/codegenNativeComponent':
          '@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent',
        ...BABEL_EXTERNALS,
        ...externals,
      },
      target: 'es5',
      minify: true,
    })
    .rename('index.ios.js')
    .target('dist/compiled/' + moduleId);
}
export async function compile_react_navigation_elements(task, opts) {
  const moduleId = '@react-navigation/elements';
  const externals = {
    'prop-types': 'prop-types',

    '@react-navigation/routers': '@react-navigation/routers',
    'escape-string-regexp': 'escape-string-regexp',
    nanoid: 'nanoid',
    'nanoid/non-secure': 'nanoid/non-secure',
    'query-string': 'query-string',
    'react-is': 'react-is',
    'use-latest-callback': 'use-latest-callback',

    '@react-navigation/native': '@react-navigation/native',
    'react-native-safe-area-context': 'react-native-safe-area-context',

    '@react-native-masked-view/masked-view': '@react-native-masked-view/masked-view',
  };

  const rnDir = path.join(require.resolve(moduleId + '/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(png|js|ts|tsx)';

  const out = `dist/compiled/${moduleId}/_temp-ios`;
  return task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: moduleId,
      externals: [
        /(\.png)$/i,
        {
          invariant: 'invariant',
          react: 'react',
          'react/jsx-runtime': 'react/jsx-runtime',
          'react-native': '@expo/cli/dist/compiled/react-native',
          'react-native/Libraries/Utilities/codegenNativeComponent':
            '@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent',

          ...BABEL_EXTERNALS,
          ...externals,
        },
      ],
      target: 'es5',
      minify: true,
    })
    .rename('index.ios.js')
    .target('dist/compiled/' + moduleId);
}
export async function compile_react_navigation_routers(task, opts) {
  const moduleId = '@react-navigation/routers';
  const externals = {
    'prop-types': 'prop-types',

    '@react-navigation/routers': '@react-navigation/routers',
    'escape-string-regexp': 'escape-string-regexp',
    nanoid: 'nanoid',
    'nanoid/non-secure': 'nanoid/non-secure',
    'query-string': 'query-string',
    'react-is': 'react-is',
    'use-latest-callback': 'use-latest-callback',
  };

  const rnDir = path.join(require.resolve(moduleId + '/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|ts|tsx)';

  const out = `dist/compiled/${moduleId}/_temp-ios`;
  return task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: moduleId,
      externals: {
        invariant: 'invariant',
        react: 'react',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react-native': '@expo/cli/dist/compiled/react-native',
        'react-native/Libraries/Utilities/codegenNativeComponent':
          '@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent',

        ...BABEL_EXTERNALS,

        ...externals,
      },
      target: 'es5',
      minify: true,
    })
    .rename('index.ios.js')
    .target('dist/compiled/' + moduleId);
}
export async function compile_react_native_safe_area_context(task, opts) {
  const moduleId = 'react-native-safe-area-context';
  const externals = {};

  const rnDir = path.join(require.resolve(moduleId + '/package.json'), '../lib/module');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|ts|tsx)';

  const out = `dist/compiled/${moduleId}/_temp-ios`;
  return task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .collapsePlatformExtensions('ios')
    .target(out)
    .source(path.join(out, 'index.js'))
    .ncc({
      packageName: moduleId,
      externals: {
        invariant: 'invariant',
        react: 'react',
        'react/jsx-runtime': 'react/jsx-runtime',
        'react-native': '@expo/cli/dist/compiled/react-native',
        'react-native/Libraries/Utilities/codegenNativeComponent':
          '@expo/cli/dist/compiled/react-native/Libraries/Utilities/codegenNativeComponent',

        ...BABEL_EXTERNALS,

        ...externals,
      },
      target: 'es5',
      minify: false,
    })
    .rename('index.ios.js')
    .target('dist/compiled/' + moduleId);
}

export async function compile_react_native_screens(task, opts) {
  const rnDir = path.join(require.resolve('react-native-screens/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|tsx|ts|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**', '**/__flowtests__/**'].map(
          (p) => path.relative(__dirname, rnDir) + '/' + p
        ),
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .target('dist/compiled/react-native-screens');
}
// export async function compile_abort_controller(task, opts) {
//   const rnDir = path.join(require.resolve('abort-controller/package.json'), '../src');
//   const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|tsx|ts|json)';

//   await task
//     .source(sourceDir, {
//       ignore: [
//         ...['node_modules/**', '**/__tests__/**', '**/__mocks__/**', '**/__flowtests__/**'].map(
//           (p) => path.relative(__dirname, rnDir) + '/' + p
//         ),
//       ],
//     })
//     .metroBabel('cli', { dev: opts.dev })
//     .target('dist/compiled/abort-controller');
// }
export async function compile_react_freeze(task, opts) {
  const rnDir = path.join(require.resolve('react-freeze/package.json'), '../src');
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|tsx|ts|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...[
          'node_modules/**',
          '**/__tests__/**',
          '**/*.test.*',
          '**/__mocks__/**',
          '**/__flowtests__/**',
        ].map((p) => path.relative(__dirname, rnDir) + '/' + p),
      ],
    })
    .metroBabel('cli', { minify: true })
    .target('dist/compiled/react-freeze');
}
export async function compile__react_native_masked_view_masked_view(task, opts) {
  const rnDir = path.join(
    require.resolve('@react-native-masked-view/masked-view/package.json'),
    '../'
  );
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(js|jsx|tsx|ts|json)';

  await task
    .source(sourceDir, {
      ignore: [
        ...[
          'node_modules/**',
          '**/__tests__/**',
          '**/*.test.*',
          '**/__mocks__/**',
          '**/__flowtests__/**',
        ].map((p) => path.relative(__dirname, rnDir) + '/' + p),
      ],
    })
    .metroBabel('cli', { minify: true })
    .target('dist/compiled/@react-native-masked-view/masked-view');
}

export async function compile_react_native(task, opts) {
  const rnDir = path.join(require.resolve('react-native/package.json'), '..');
  const rnPkg = require(path.join(rnDir, 'package.json'));
  // const sourceDir = path.relative(__dirname, rnDir) + '/index.js';
  // const sourceDir =
  //   path.relative(__dirname, rnDir) + '/Libraries/TurboModule/samples/NativeSampleTurboModule.js';
  const sourceDir = path.relative(__dirname, rnDir) + '/**/*.+(png|js|jsx|json)';

  await task
    .source(sourceDir, {
      ignore: [
        // '**/node_modules/**',
        // ...rnPkg.files
        //   .filter((pattern) => pattern.startsWith('!'))
        //   .map((pattern) => pattern.slice(1)),

        ...[
          'node_modules/**',
          'template/**',
          'jest/**',
          'ReactAndroid/**',
          'flow/**',
          'flow-typed/**',
          'types/**',
          'scripts/**',
          'template.config.js',

          '**/__tests__/**',
          '**/__mocks__/**',
          '**/__flowtests__/**',
        ].map((p) => path.relative(__dirname, rnDir) + '/' + p),

        // '/LICENSE',
        // // 'interface.js',
        // // 'Libraries/',
        // '/jest',
        // 'README.md',
        // '/jest-preset.js',
        // // 'React/',
        // // 'local-cli/',
        // 'React-Core.podspec',
        // 'React.podspec',
        // // 'package.json',
        // '/ReactAndroid',
        // // 'react-native.config.js',
        // // '/ReactCommon',
        // // 'rn-get-polyfills.js',
        // '/android',
        // // '/scripts',
        // 'build.gradle.kts',
        // // '/sdks',
        // // '/cli.js*',
        // 'settings.gradle.kts',
        // '/flow',
        // '/template',
        // '/flow-typed',
        // '/template.config.js',
        // '/gradle.properties',
        // '/third-party-podspecs',
        // // 'index.js',
        // '/types',
      ],
    })
    .metroBabel('cli', { dev: opts.dev })
    .target('dist/compiled/react-native');
}

// TODO: @react-native/virtualized-lists
// ../../node_modules/@react-native/normalize-colors/index.js
// End prebuilt modules

export default async function (task) {
  const opts = { dev: true };
  // await task.clear('dist/compiled');
  // await task.start('compile_react_native', opts);
  // await task.start('compile_metro_runtime', opts);
  // await task.start('compile__react_native_virtualized_lists', opts);
  // // await task.clear('dist/compiled/expo-modules-core');
  // await task.start('compile_expo_modules_core', opts);
  // // await task.clear('dist/compiled/react-native-safe-area-context');
  // await task.start('compile_react_native_safe_area_context', opts);

  // // await task.clear('dist/compiled/react-native-screens');
  // await task.start('compile_react_native_screens', opts);
  // await task.start('compile_react_freeze', opts);
  // await task.start('compile__react_native_masked_view_masked_view', opts);
  // await task.clear('dist/compiled/@react-navigation/elements');
  // await task.start('compile_react_navigation_core', opts);
  // await task.start('compile_react_navigation_routers', opts);
  // await task.start('compile_react_navigation_elements', opts);
  // await task.clear('dist/compiled/deprecated-react-native-prop-types');
  // await task.start('compile_deprecated_react_native_prop_types', opts);
  // await task.start('compile_pretty_format', opts);

  // await task.clear('build');
  // await task.start('build', opts);
  // if (process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
  //   await task.watch('bin/*', 'bin', opts);
  //   await task.watch('src/**/*.+(js|ts)', 'cli', opts);
  // }
}

export async function release(task) {
  await task.clear('build').start('build');
}
