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

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  if (process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
    await task.watch('bin/*', 'bin', opts);
    await task.watch('src/**/*.+(js|ts)', 'cli', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
