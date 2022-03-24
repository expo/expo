const { boolish } = require('getenv');

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

export async function src(task, opts) {
  await task
    .source(opts.src || 'src/**/*.+(js|ts|tsx)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('sdk', { dev: opts.dev })
    .target('build');
}

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  if (require('tty').isatty(1) && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
    await task.watch('bin/*', 'bin', opts);
    await task.watch('src/**/*.+(js|ts)', 'src', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
