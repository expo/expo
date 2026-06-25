const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\nRunning pre-test commands...\n');
  execSync('pnpm run --filter create-expo build:prod', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-build-properties build', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-brownfield build:plugin', { stdio: 'inherit' });
  execSync('pnpm run --filter expo-brownfield build:cli', { stdio: 'inherit' });
};
