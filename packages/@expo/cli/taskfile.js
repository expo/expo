const { boolish } = require('getenv');
const path = require('path');
const process = require('process');

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

// End prebuilt modules

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  await task.clear('dist/compiled');
  await task.start('compile_react_native', opts);
  if (process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
    await task.watch('bin/*', 'bin', opts);
    await task.watch('src/**/*.+(js|ts)', 'cli', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
