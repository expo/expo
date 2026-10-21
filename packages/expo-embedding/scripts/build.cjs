const path = require('node:path');
const { buildSync } = require('esbuild');

buildSync({
  absWorkingDir: path.resolve(__dirname, '..'),
  entryPoints: ['src/cli.ts'],
  outfile: 'build/cli.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
});

buildSync({
  absWorkingDir: path.resolve(__dirname, '..'),
  entryPoints: ['src/native.ts'],
  outfile: 'build/native.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
});
