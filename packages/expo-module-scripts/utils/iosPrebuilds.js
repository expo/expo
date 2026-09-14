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

function expectedPaths(packageRoot, product, flavor, root) {
  const directory = path.join(packageRoot, root, flavor, 'xcframeworks');
  return {
    directory,
    framework: path.join(directory, `${product.name}.xcframework`),
    tarball: path.join(directory, `${product.name}.tar.gz`),
  };
}

function requireDirectory(directory, description) {
  let stat;
  try {
    stat = fs.statSync(directory);
  } catch {}
  if (!stat?.isDirectory()) throw new Error(`${description} is missing: ${directory}`);
  if (!fs.existsSync(path.join(directory, 'Info.plist'))) {
    throw new Error(`${description} has no Info.plist: ${directory}`);
  }
}

export function validateRawIosPrebuilds(packageRoot = process.cwd()) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  for (const product of products) {
    for (const flavor of FLAVORS) {
      const { framework } = expectedPaths(packageRoot, product, flavor, '.expo-prebuild/output');
      requireDirectory(framework, `${product.name} ${flavor} XCFramework`);
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
    for (const flavor of FLAVORS) {
      const { tarball } = expectedPaths(packageRoot, product, flavor, 'prebuilds/output');
      if (!fs.statSync(tarball, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`${product.name} ${flavor} publish tarball is missing: ${tarball}`);
      }
      const listing = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
      if (listing.status !== 0) {
        throw new Error(`Invalid publish tarball ${tarball}: ${listing.stderr.trim()}`);
      }
      const frameworkPrefix = `${product.name}.xcframework/`;
      if (!listing.stdout.split('\n').some((entry) => entry.startsWith(frameworkPrefix))) {
        throw new Error(`${tarball} does not contain ${product.name}.xcframework`);
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
    for (const flavor of FLAVORS) {
      const raw = expectedPaths(packageRoot, product, flavor, '.expo-prebuild/output');
      const staged = expectedPaths(packageRoot, product, flavor, 'prebuilds/output');
      fs.mkdirSync(staged.directory, { recursive: true });
      const result = runTar(
        'tar',
        ['-czf', staged.tarball, '-C', raw.directory, `${product.name}.xcframework`],
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
