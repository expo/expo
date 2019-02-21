const path = require('path');
const findWorkspaceRoot = require('find-yarn-workspace-root');
const absolute = (...locations) => path.resolve(__dirname, '../', ...locations);

const packageJsonPath = absolute('./package.json');
const appJsonPath = absolute('./app.json');

const projectRoot = absolute();
const workspaceRoot = findWorkspaceRoot(projectRoot); // Absolute path or null

let modulesPath;

if (workspaceRoot) {
  modulesPath = path.resolve(workspaceRoot, 'node_modules');
} else {
  modulesPath = absolute('node_modules');
}

const pckg = require(packageJsonPath);
const nativeAppManifest = require(appJsonPath);

const { expo: expoManifest = {} } = nativeAppManifest;
const { web: expoManifestWebManifest = {} } = expoManifest;

const favicon = expoManifestWebManifest.favicon
  ? absolute(expoManifestWebManifest.favicon)
  : undefined;

const { productionPath: productionPathFolderName = 'web-build' } = expoManifestWebManifest;

const productionPath = absolute(productionPathFolderName);

const templatePath = absolute('web');

module.exports = {
  absolute,
  packageJson: packageJsonPath,
  appJson: appJsonPath,
  root: projectRoot,
  appMain: absolute(pckg.main),
  modules: modulesPath,
  template: {
    folder: templatePath,
    indexHtml: path.resolve(templatePath, 'index.html'),
    manifest: path.resolve(templatePath, 'manifest.json'),
    serveJson: path.resolve(templatePath, 'serve.json'),
    favicon,
  },
  production: {
    folder: productionPath,
    indexHtml: path.resolve(productionPath, 'index.html'),
    manifest: path.resolve(productionPath, 'manifest.json'),
    serveJson: path.resolve(productionPath, 'serve.json'),
  },
};
