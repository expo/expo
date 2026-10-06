import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FLAVORS = ['debug', 'release'];

export function readPublishedIosProducts(packageRoot = process.cwd()) {
  const configPath = path.join(packageRoot, 'spm.config.json');
  if (!fs.existsSync(configPath)) return null;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (config.publishPrebuilds !== true) return null;
  return (config.products ?? []).filter((product) => product.sourceOnly !== true);
}

function getSpmDependencyNames(products) {
  return [
    ...new Set(
      products.flatMap((product) =>
        (product.spmPackages ?? []).map((dependency) => dependency.productName)
      )
    ),
  ];
}

function getProductArchives(product) {
  const archives = FLAVORS.map((flavor) => ({
    label: `${product.name} ${flavor}`,
    directoryName: flavor,
    frameworkName: product.name,
  }));
  if (product.headersXCFramework === true) {
    archives.push({
      label: `${product.name} headers`,
      directoryName: 'headers',
      frameworkName: `${product.name}Headers`,
      missingHint:
        `spm.config.json sets "headersXCFramework": true for ${product.name}, but the prebuild ` +
        'did not produce its headers XCFramework. Run `et prebuild-package-for-publish` in this ' +
        'package to rebuild the prebuilds.',
    });
  }
  return archives;
}

function expectedPaths(packageRoot, archive, root) {
  const directory = path.join(packageRoot, root, archive.directoryName, 'xcframeworks');
  return {
    directory,
    framework: path.join(directory, `${archive.frameworkName}.xcframework`),
    tarball: path.join(directory, `${archive.frameworkName}.tar.gz`),
  };
}

function requireDirectory(directory, description, hint) {
  const details = hint ? `\n${hint}` : '';
  let stat;
  try {
    stat = fs.statSync(directory);
  } catch {}
  if (!stat?.isDirectory()) throw new Error(`${description} is missing: ${directory}${details}`);
  if (!fs.existsSync(path.join(directory, 'Info.plist'))) {
    throw new Error(`${description} has no Info.plist: ${directory}${details}`);
  }
}

export function validateRawIosPrebuilds(packageRoot = process.cwd()) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  for (const product of products) {
    for (const archive of getProductArchives(product)) {
      const { framework } = expectedPaths(packageRoot, archive, '.expo-prebuild/output');
      requireDirectory(framework, `${archive.label} XCFramework`, archive.missingHint);
    }
  }
  for (const dependencyName of getSpmDependencyNames(products)) {
    for (const flavor of FLAVORS) {
      const directory = path.join(
        packageRoot,
        '.expo-prebuild/output',
        flavor,
        'xcframeworks',
        `${dependencyName}.xcframework`
      );
      requireDirectory(directory, `${dependencyName} ${flavor} SPM dependency XCFramework`);
    }
  }
  return true;
}

export function validatePublishedIosPrebuilds(packageRoot = process.cwd()) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  for (const product of products) {
    for (const archive of getProductArchives(product)) {
      const { tarball } = expectedPaths(packageRoot, archive, 'prebuilds/output');
      if (!fs.statSync(tarball, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`${archive.label} publish tarball is missing: ${tarball}`);
      }
      const listing = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
      if (listing.status !== 0) {
        throw new Error(`Invalid publish tarball ${tarball}: ${listing.stderr.trim()}`);
      }
      const frameworkPrefix = `${archive.frameworkName}.xcframework/`;
      if (!listing.stdout.split('\n').some((entry) => entry.startsWith(frameworkPrefix))) {
        throw new Error(`${tarball} does not contain ${archive.frameworkName}.xcframework`);
      }
    }
  }
  for (const dependencyName of getSpmDependencyNames(products)) {
    for (const flavor of FLAVORS) {
      const directory = path.join(
        packageRoot,
        'prebuilds/spm-deps',
        dependencyName,
        flavor,
        `${dependencyName}.xcframework`
      );
      requireDirectory(
        directory,
        `${dependencyName} ${flavor} published SPM dependency XCFramework`
      );
    }
  }
  return true;
}

export function stageIosPrebuilds(packageRoot = process.cwd(), runTar = spawnSync) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  validateRawIosPrebuilds(packageRoot);
  const stagingRoot = path.join(packageRoot, 'prebuilds');
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  for (const product of products) {
    for (const archive of getProductArchives(product)) {
      const raw = expectedPaths(packageRoot, archive, '.expo-prebuild/output');
      const staged = expectedPaths(packageRoot, archive, 'prebuilds/output');
      fs.mkdirSync(staged.directory, { recursive: true });
      const result = runTar(
        'tar',
        ['-czf', staged.tarball, '-C', raw.directory, `${archive.frameworkName}.xcframework`],
        { encoding: 'utf8' }
      );
      if (result.status !== 0) {
        throw new Error(`Failed to create ${staged.tarball}: ${result.stderr.trim()}`);
      }
    }
  }
  for (const dependencyName of getSpmDependencyNames(products)) {
    for (const flavor of FLAVORS) {
      const source = path.join(
        packageRoot,
        '.expo-prebuild/output',
        flavor,
        'xcframeworks',
        `${dependencyName}.xcframework`
      );
      const destination = path.join(
        stagingRoot,
        'spm-deps',
        dependencyName,
        flavor,
        `${dependencyName}.xcframework`
      );
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.cpSync(source, destination, { recursive: true });
    }
  }
  validatePublishedIosPrebuilds(packageRoot);
  return true;
}
