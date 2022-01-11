// Disable the client transpilation for now...
const IS_CLIENT_SUPPORTED = false;

export async function bin(task, opts) {
  await task
    .source(opts.src || 'bin/*')
    .swc('cli', { stripExtension: true, dev: opts.dev })
    .target('build-cli/bin', { mode: '0755' });
}

export async function cli(task, opts) {
  await task
    .source('cli/**/*.+(js|ts)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('cli', { dev: opts.dev })
    .target('build-cli/cli');
}

export async function build(task, opts) {
  await task.parallel(['cli', 'bin', IS_CLIENT_SUPPORTED && 'client'].filter(Boolean), opts);
}

export async function client(task, opts) {
  await task.parallel(['src', 'tsc'], opts);
}

export async function src(task, opts) {
  await task
    .source(opts.src || 'src/**/*.+(js|ts|tsx)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('sdk', { dev: opts.dev })
    .target('build');
}

export async function tsc(task, opts) {
  await task
    .source(opts.src || 'src/**/*.+(js|ts|tsx)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .typescript({
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
    })
    .target('build');
}

export default async function (task) {
  const opts = { dev: true };
  await task.clear('build-cli');
  await task.start('build', opts);
  await task.watch('bin/*', 'bin', opts);
  await task.watch('cli/**/*.+(js|ts)', 'cli', opts);

  if (IS_CLIENT_SUPPORTED) {
    await task.watch('src/**/*.+(js|ts|tsx)', 'client', opts);
  }
}

export async function release(task) {
  await task.clear('build-cli').start('build');
}
