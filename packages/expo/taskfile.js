export async function bin(task, opts) {
  await task
    .source(opts.src || 'bin/*')
    .swc('server', { stripExtension: true, dev: opts.dev })
    .target('build/bin', { mode: '0755' });
}

export async function cli(task, opts) {
  await task
    .source('cli/**/*.+(js|ts|tsx)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('server', { dev: opts.dev })
    .target('build/cli');
}

export async function build(task, opts) {
  await task.parallel(['cli', 'bin', 'src'], opts);
}

export async function src(task, opts) {
  await task
    .source(opts.src || 'src/**/*.+(js|ts|tsx)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('client', { dev: opts.dev })
    .target('build');
}

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  await task.watch('bin/*', 'bin', opts);
  await task.watch('cli/**/*.+(js|ts|tsx)', 'cli', opts);
  await task.watch('src/**/*.+(js|ts|tsx)', 'src', opts);
}

export async function release(task) {
  await task.clear('build').start('build');
}
