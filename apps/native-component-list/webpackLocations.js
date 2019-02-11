const path = require('path');
const pckg = require('./package.json');

const absolute = location => path.resolve(__dirname, location);

module.exports = {
  absolute,
  // Shouldn't change
  root: absolute('.'),
  contentBase: absolute('web'),
  rootHtml: absolute('web/index.html'),
  packageJson: absolute('package.json'),
  appMain: absolute(pckg.main),

  // TODO: Bacon: Only use this in expo/apps/
  modules: absolute('../../node_modules'),
};
