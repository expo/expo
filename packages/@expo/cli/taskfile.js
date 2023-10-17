const path = require('path');
const { boolish } = require('getenv');
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

export async function compile_polyfill_standalone(task, opts) {
  const rnDir = path.join(__dirname, 'native-polyfills/src');
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
    .target('build/native-polyfills');
}

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  await task.start('compile_polyfill_standalone', opts);
  if (process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
    await task.watch('bin/*', 'bin', opts);
    await task.watch('src/**/*.+(js|ts)', 'cli', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
