const { execSync } = require('child_process');
const spawnAsync = require('@expo/spawn-async');
const { glob } = require('glob');
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_DIR = path.resolve(__dirname, '../../../../templates/expo-template-default');

module.exports = async () => {
  console.log('\nRunning pre-test commands...\n');
  execSync('pnpm run --filter create-expo build:prod', { stdio: 'inherit' });

  // Prepare the template tarball once, before Jest forks its parallel workers.
  const staleTarballs = await glob('*.tgz', { cwd: TEMPLATE_DIR, absolute: true });
  await Promise.all(staleTarballs.map((tarball) => fs.promises.rm(tarball, { force: true })));
  await spawnAsync('pnpm', ['pack'], { cwd: TEMPLATE_DIR, stdio: 'inherit' });
};
