#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removePackages(expoDirectory, projectDirectory, packagesToRemove) {
  const pkgJson = require(path.resolve(projectDirectory, './package.json'));
  const symlinks = pkgJson.expo.symlinks;
  const nextSymlinks = [];

  symlinks.forEach((packageName) => {
    if (!packagesToRemove.includes(packageName)) {
      nextSymlinks.push(packageName);
    } else {
      delete pkgJson.dependencies[packageName];

      const nodeModulesPackage = path.resolve(projectDirectory, 'node_modules', packageName);

      fs.rmSync(nodeModulesPackage, { recursive: true });
    }
  });

  nextSymlinks.forEach((packageName) => {
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

  pkgJson.expo.symlinks = nextSymlinks;

  fs.writeFileSync(
    path.resolve(projectDirectory, './package.json'),
    JSON.stringify(pkgJson, null, 2),
    { encoding: 'utf-8' }
  );

  console.log('Removing packages complete');
}

const [expoDirectory, projectDirectory, ...packageNames] = process.argv.slice(2);
removePackages(expoDirectory, projectDirectory, packageNames);
