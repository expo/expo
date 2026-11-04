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
      products
        .filter((product) => !product.customBuild)
        .flatMap((product) =>
          (product.spmPackages ?? []).map((dependency) => dependency.productName)
        )
    ),
  ];
}

function getFlavors(product) {
  const headers = product.headersXCFramework === true ? ['headers'] : [];
  if (!product.customBuild) return [...FLAVORS, ...headers];
  // CocoaPods precompiled mode, including released autolinking versions, picks up any
  // `<flavor>/xcframeworks/<Product>.tar.gz` but cannot consume a pod that vendors its own
  // xcframework, so a custom-build product publishes its headers only.
  if (headers.length === 0) {
    throw new Error(
      `${product.name} has a customBuild, and a custom-build product publishes only its headers ` +
        'XCFramework, so it needs "headersXCFramework": true in spm.config.json. Set it, or ' +
        'remove "publishPrebuilds" to stop publishing prebuilds for this package.'
    );
  }
  return headers;
}

function expectedPaths(packageRoot, product, flavor, root) {
  const directory = path.join(packageRoot, root, flavor, 'xcframeworks');
  const name = flavor === 'headers' ? `${product.name}Headers` : product.name;
  return {
    directory,
    name,
    framework: path.join(directory, `${name}.xcframework`),
    tarball: path.join(directory, `${name}.tar.gz`),
  };
}

const ABI_FILE = 'arm64-apple-ios-simulator.abi.json';

function abiPaths(packageRoot, product) {
  const { framework } = expectedPaths(packageRoot, product, 'release', '.expo-prebuild/output');
  return {
    raw: path.join(
      framework,
      'ios-arm64_x86_64-simulator',
      `${product.name}.framework`,
      'Modules',
      `${product.name}.swiftmodule`,
      ABI_FILE
    ),
    staged: path.join(packageRoot, 'prebuilds/abi', product.name, ABI_FILE),
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

function requireRawXCFramework(directory, description) {
  try {
    requireDirectory(directory, description);
  } catch (error) {
    throw new Error(
      `${error.message}\nRun \`et prebuild-package-for-publish\` in this package to rebuild the prebuilds.`
    );
  }
}

export function validateRawIosPrebuilds(packageRoot = process.cwd()) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  for (const product of products) {
    for (const flavor of getFlavors(product)) {
      const { framework } = expectedPaths(packageRoot, product, flavor, '.expo-prebuild/output');
      requireRawXCFramework(framework, `${product.name} ${flavor} XCFramework`);
    }
    if (product.publishAbiDescriptor === true) {
      const { raw } = abiPaths(packageRoot, product);
      if (!fs.statSync(raw, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(
          `${product.name} release ABI file is missing: ${raw}\n` +
            'Run `et prebuild-package-for-publish` in this package to rebuild the prebuilds.'
        );
      }
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
      requireRawXCFramework(directory, `${dependencyName} ${flavor} SPM dependency XCFramework`);
    }
  }
  return true;
}

export function validatePublishedIosPrebuilds(packageRoot = process.cwd()) {
  const products = readPublishedIosProducts(packageRoot);
  if (!products) return false;
  for (const product of products) {
    for (const flavor of getFlavors(product)) {
      const { name, tarball } = expectedPaths(packageRoot, product, flavor, 'prebuilds/output');
      if (!fs.statSync(tarball, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`${product.name} ${flavor} publish tarball is missing: ${tarball}`);
      }
      const listing = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
      if (listing.status !== 0) {
        throw new Error(`Invalid publish tarball ${tarball}: ${listing.stderr.trim()}`);
      }
      const frameworkPrefix = `${name}.xcframework/`;
      if (!listing.stdout.split('\n').some((entry) => entry.startsWith(frameworkPrefix))) {
        throw new Error(`${tarball} does not contain ${name}.xcframework`);
      }
    }
    if (product.publishAbiDescriptor === true) {
      const { staged } = abiPaths(packageRoot, product);
      if (!fs.statSync(staged, { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`${product.name} ABI file is missing: ${staged}`);
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
  const stagingRoot = path.join(packageRoot, 'prebuilds');
  const products = readPublishedIosProducts(packageRoot);
  if (!products) {
    // Output staged before the package stopped publishing prebuilds would still be packed.
    if (fs.existsSync(path.join(packageRoot, 'spm.config.json'))) {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
    return false;
  }
  validateRawIosPrebuilds(packageRoot);
  fs.rmSync(stagingRoot, { recursive: true, force: true });
  for (const product of products) {
    for (const flavor of getFlavors(product)) {
      const raw = expectedPaths(packageRoot, product, flavor, '.expo-prebuild/output');
      const staged = expectedPaths(packageRoot, product, flavor, 'prebuilds/output');
      fs.mkdirSync(staged.directory, { recursive: true });
      const result = runTar(
        'tar',
        ['-czf', staged.tarball, '-C', raw.directory, `${raw.name}.xcframework`],
        { encoding: 'utf8' }
      );
      if (result.status !== 0) {
        throw new Error(`Failed to create ${staged.tarball}: ${result.stderr.trim()}`);
      }
    }
    if (product.publishAbiDescriptor === true) {
      const { raw, staged } = abiPaths(packageRoot, product);
      fs.mkdirSync(path.dirname(staged), { recursive: true });
      fs.copyFileSync(raw, staged);
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
