// For testing
const { withExpoPuppeteer } = require('./build');

module.exports = withExpoPuppeteer({
  projectRoot: `tests/basic`,
  mode: process.env.E2E_ENV,
});
