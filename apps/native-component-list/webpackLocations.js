const path = require('path');
const pckg = require('./package.json');

const absolute = location => path.resolve(__dirname, location);

const nativeAppManifest = require(absolute('./app.json'));

const { productionPath = 'web-build' } = nativeAppManifest.expo.web;

module.exports = {
  absolute,
  // Shouldn't change
  root: absolute('.'),
  contentBase: absolute('web'),
  rootHtml: absolute('web/index.html'),
  packageJson: absolute('package.json'),
  appMain: absolute(pckg.main),
  production: absolute(productionPath),

  // TODO: Bacon: Only use this in expo/apps/
  modules: absolute('../../node_modules'),
};
