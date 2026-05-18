const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\nRunning pre-test commands...\n');
  execSync('pnpm run --filter create-expo build:prod', { stdio: 'inherit' });
};
