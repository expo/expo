// For testing

const fs = require('fs');
const { boolish } = require('getenv');
const path = require('path');
const isCI = boolish('CI', false);

const isProduction = process.env.EXPO_WEB_E2E_ENV === 'production';
const projectPath = process.cwd();

// Note(cedric): we can only change the port when using Metro web bundler
// As of writing, we use Webpack for web, which can't run on the same port as Metro.
// It always tries to fall back to Webpack's default port, which is 19006.
const port = 19006;

function getCommand() {
  if (!isProduction) {
    const cliBin = require.resolve('@expo/cli');
    // Note(cedric): we can only change the port when using Metro web bundler
    // As of writing, we use Webpack for web, which can't run on the same port as Metro.
    // It always tries to fall back to Webpack's default port, which is 19006.
    return `node ${cliBin} start ${projectPath} --web --https`;
  }

  // Production mode

  const buildFolder = path.resolve(projectPath, 'web-build');
  const hasBuild = fs.existsSync(buildFolder);

  return [
    // Optionally bundle the project
    (isCI || !hasBuild) && `npx expo-internal export:web`,
    // Serve for puppeteer
    `npx serve ${buildFolder}`,
  ]
    .filter(Boolean)
    .join(' && ');
}

module.exports = {
  url: `http${isProduction ? '' : 's'}://localhost:${port}`,
  server: {
    launchTimeout: 60000,
    debug: true,
    command: getCommand(),
    port,
  },
  launch: {
    args: isCI
      ? ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
      : ['--ignore-certificate-errors'],
    ignoreHTTPSErrors: true,
    headless: true,
  },
};

console.log('Using puppeteer config:', module.exports);
