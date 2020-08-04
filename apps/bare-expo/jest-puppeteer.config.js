// For testing
const { withExpoPuppeteer } = require('jest-expo-puppeteer');

module.exports = withExpoPuppeteer({
  server: {
    launchTimeout: 60000
  },
  launch: {
    //   headless: false,
  },
});
