const { boolish } = require('getenv');
const process = require('process');

export async function bin(task, opts) {
  await task
    .source(opts.src || 'bin/*')
    .swc('cli', { stripExtension: true, dev: opts.dev })
    .target('build/bin', { mode: '0755' });
}

export async function metroRequire(task, opts) {
  await task
    .source('metro-require/**/*.+(js|ts)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**', '**/__typetests__/**'],
    })
    .swc('metroScript', { dev: opts.dev })
    .target('build/metro-require');
}

export async function cli(task, opts) {
  await task
    .source('src/**/*.+(js|ts)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**', '**/__typetests__/**'],
    })
    .swc('cli', { dev: opts.dev })
    .target('build/src');
}

export async function build(task, opts) {
  await task.parallel(['cli', 'bin', 'metroRequire'], opts);
}

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  const isTurboNonInteractive = process.env.TURBO_HASH && process.env.TURBO_IS_TUI !== 'true';
  const isInteractive = process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false);
  if (!isTurboNonInteractive && isInteractive) {
    await task.watch('metro-require/*', 'metroRequire', opts);
    await task.watch('bin/*', 'bin', opts);
    await task.watch('src/**/*.+(js|ts)', 'cli', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
