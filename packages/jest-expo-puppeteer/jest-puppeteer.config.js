// For testing
const { withExpoPuppeteer } = require('./build');

module.exports = withExpoPuppeteer({
  projectRoot: `tests/basic`,
});
