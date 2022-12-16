#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function symlinkPackages(expoDirectory, projectDirectory, packageNames) {
  const pkgJson = require(path.resolve(projectDirectory, './package.json'));
  const symlinks = pkgJson.expo.symlinks;

  packageNames.forEach((packageName) => {
    if (!symlinks.includes(packageName)) {
      symlinks.push(packageName);
    }

    // add any dependencies of the specified packages if they are not already symlinked
    const dependencies = getPackageDependencies({ packageName });
    dependencies.forEach((dependency) => {
      if (!symlinks.includes(dependency)) {
        symlinks.push(dependency);
      }
    });
  });

  symlinks.forEach((packageName) => {
    const pathToPackage = path.resolve(expoDirectory, 'packages', packageName);

    const nodeModulesPackage = path.resolve(projectDirectory, 'node_modules', packageName);

    const pkg = require(path.resolve(pathToPackage, 'package.json'));
    const version = pkg.version || '*';

    pkgJson.dependencies[packageName] = version;

    if (fs.existsSync(nodeModulesPackage)) {
      fs.rmSync(nodeModulesPackage, { recursive: true });
    }

    fs.symlinkSync(pathToPackage, nodeModulesPackage);
  });

  fs.writeFileSync(
    path.resolve(projectDirectory, './package.json'),
    JSON.stringify(pkgJson, null, 2),
    { encoding: 'utf-8' }
  );

  function getPackageDependencies({ packageName }) {
    const packagePath = path.resolve(expoDirectory, 'packages', packageName, 'package.json');

    if (!fs.existsSync(packagePath)) {
      return [];
    }

    const dependencies = new Set([packageName]);

    const pkg = require(packagePath);

    if (pkg.dependencies) {
      Object.keys(pkg.dependencies).forEach((dependency) => {
        const deps = getPackageDependencies({ packageName: dependency });
        deps.forEach((dep) => dependencies.add(dep));
      });
    }

    return Array.from(dependencies);
  }

  console.log('Symlinking packages complete');
}

const [expoDirectory, projectDirectory, ...packageNames] = process.argv.slice(2);
symlinkPackages(expoDirectory, projectDirectory, packageNames);
