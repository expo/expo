import { boolish } from 'getenv';
import process from 'node:process';

export async function build(task, opts) {
  // Process JS/TS files with SWC
  await task
    .source('src/**/*.+(js|ts)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .swc('cli', { dev: opts.dev })
    .target('build');

  // Copy over JSON files
  await task
    .source('src/**/*.+(json)', {
      ignore: ['**/__tests__/**', '**/__mocks__/**'],
    })
    .target('build');
}

export default async function (task) {
  await task.clear('build');
  await task.start('build', { dev: true });
}

export async function watch(task) {
  const opts = { dev: true };
  await task.clear('build');
  await task.start('build', opts);
  if (process.stdout.isTTY && !boolish('CI', false) && !boolish('EXPO_NONINTERACTIVE', false)) {
    // Watch source folder
    await task.watch('src/**/*.+(js|ts|json)', 'build', opts);
  }
}

export async function release(task) {
  await task.clear('build').start('build');
}
