const path = require('node:path');
const { build } = require('esbuild');

async function main() {
  await build({
    absWorkingDir: path.resolve(__dirname, '..'),
    entryPoints: ['src/cli.ts'],
    outfile: 'build/cli.js',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
  });

  await build({
    absWorkingDir: path.resolve(__dirname, '..'),
    entryPoints: ['src/native.ts'],
    outfile: 'build/native.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
  });
}
main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
