const path = require('path');

const absolute = (...locations) => path.resolve(__dirname, '../', ...locations);

const packageJsonPath = absolute('./package.json');
const appJsonPath = absolute('./app.json');

const pckg = require(packageJsonPath);
const nativeAppManifest = require(appJsonPath);

const { expo: expoManifest = {} } = nativeAppManifest;
const { web: expoManifestWebManifest = {} } = expoManifest;

const favicon = expoManifestWebManifest.favicon ? absolute(expoManifestWebManifest.favicon) : undefined;

const { productionPath: productionPathFolderName = 'web-build' } = expoManifestWebManifest;

const productionPath = absolute(productionPathFolderName);

const templatePath = absolute('web');

module.exports = {
  absolute,
  packageJson: packageJsonPath,
  appJson: appJsonPath,
  // Shouldn't change
  root: absolute(),
  appMain: absolute(pckg.main),

  template: {
    folder: templatePath,
    indexHtml: path.resolve(templatePath, 'index.html'),
    manifest: path.resolve(templatePath, 'manifest.json'),
    serveJson: path.resolve(templatePath, 'serve.json'),
    favicon,
  },
  production: {
    folder: productionPath,
    indexHtml: path.resolve(productionPath,'index.html'),
    manifest: path.resolve(productionPath,'manifest.json'),
    serveJson: path.resolve(productionPath,'serve.json'),
  },
  
  // TODO: Bacon: Only use this in expo/apps/
  modules: absolute('../../node_modules'),
};
