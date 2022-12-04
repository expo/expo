// For testing

const fs = require('fs');
const { boolish } = require('getenv');
const path = require('path');
const isCI = boolish('CI', false);

const isProduction = process.env.EXPO_WEB_E2E_ENV === 'production';
const projectPath = process.cwd();

const port = 19007;

function getCommand() {
  if (!isProduction) {
    return `expo-cli start:web ${projectPath} -p ${port} --non-interactive --https`;
  }

  // Production mode

  const buildFolder = path.resolve(projectPath, 'web-build');
  const hasBuild = fs.existsSync(buildFolder);

  return [
    // Optionally bundle the project
    (isCI || !hasBuild) && `npx expo export:web`,
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
