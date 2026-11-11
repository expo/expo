const { execSync } = require('child_process');
const spawnAsync = require('@expo/spawn-async');
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_DIR = path.resolve(__dirname, '../../../../templates/expo-template-default');

module.exports = async () => {
  console.log('\nRunning pre-test commands...\n');
  execSync('pnpm run --filter create-expo build:prod', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-build-properties build', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-brownfield build:plugin', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-brownfield build:cli', { stdio: 'inherit' });

  // Prepare the template tarball once, before Jest forks its parallel workers.
  const staleTarballs = (
    await Array.fromAsync(fs.promises.glob('*.tgz', { cwd: TEMPLATE_DIR }))
  ).map((tarball) => path.join(TEMPLATE_DIR, tarball));
  await Promise.all(staleTarballs.map((tarball) => fs.promises.rm(tarball, { force: true })));
  await spawnAsync('pnpm', ['pack'], { cwd: TEMPLATE_DIR, stdio: 'inherit' });
};
