const { execSync } = require('child_process');

module.exports = async () => {
  console.log('\nRunning pre-test Yarn commands...\n');
  execSync('yarn workspace expo-brownfield prepare', { stdio: 'inherit' });
  execSync('yarn workspace @expo/cli prepare', { stdio: 'inherit' });
  execSync('yarn workspace create-expo build:prod', { stdio: 'inherit' });
};
