const path = require('path');
const findWorkspaceRoot = require('find-yarn-workspace-root');

function getLocations(inputProjectRoot = '../') {
  const absolute = (...pathComponents) =>
    path.resolve(__dirname, inputProjectRoot, ...pathComponents);

  const projectRoot = absolute();
  const packageJsonPath = absolute('./package.json');
  const appJsonPath = absolute('./app.json');

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

  return {
    absolute,
    includeModule: (...pathComponents) => path.resolve(modulesPath, ...pathComponents),
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
}

module.exports = getLocations;
