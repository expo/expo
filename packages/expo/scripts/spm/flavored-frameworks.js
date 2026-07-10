/**
 * Resolves Expo's precompiled dynamic frameworks as immutable Debug/Release
 * pairs for React Native's SwiftPM autolinking plugin contract.
 *
 * The resolver accepts either already-expanded XCFramework directories (the
 * Expo monorepo development layout) or the flavor tarballs bundled into npm
 * packages. Bundled tarballs are expanded synchronously into an app-local
 * cache before the plugin result is returned, so `react-native spm add` and
 * `update` always receive two real absolute paths.
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FLAVORS = ['debug', 'release'];

function stableFrameworkId(frameworkName) {
  const kebab = frameworkName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return kebab.startsWith('expo-') ? kebab : `expo-${kebab}`;
}

function artifactCandidates(baseDir, flavor, frameworkName) {
  const dir = path.join(baseDir, flavor, 'xcframeworks');
  return {
    xcframework: path.join(dir, `${frameworkName}.xcframework`),
    tarball: path.join(dir, `${frameworkName}.tar.gz`),
  };
}

function existingArtifactSource(baseDir, flavor, frameworkName) {
  const candidates = artifactCandidates(baseDir, flavor, frameworkName);
  if (fs.existsSync(candidates.xcframework)) {
    return { type: 'xcframework', path: candidates.xcframework };
  }
  if (fs.existsSync(candidates.tarball)) {
    return { type: 'tarball', path: candidates.tarball };
  }
  return null;
}

function artifactBaseDirs(packageName, moduleRoot) {
  const bases = [];
  if (process.env.EXPO_PRECOMPILED_MODULES_PATH) {
    bases.push(path.resolve(process.env.EXPO_PRECOMPILED_MODULES_PATH, packageName, 'output'));
  }
  bases.push(
    path.resolve(__dirname, '..', '..', '..', 'precompile', '.build', packageName, 'output'),
    path.join(moduleRoot, 'prebuilds', 'output')
  );
  return Array.from(new Set(bases));
}

function validateTarEntries(tarballPath, frameworkName) {
  const expectedRoot = `${frameworkName}.xcframework`;
  const listing = execFileSync('tar', ['-tzf', tarballPath], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const entries = listing
    .split('\n')
    .map((entry) => entry.replace(/^\.\//, '').replace(/\/$/, ''))
    .filter(Boolean);
  if (entries.length === 0) {
    throw new Error(`[expo-spm-plugin] ${tarballPath} is empty`);
  }
  for (const entry of entries) {
    const parts = entry.split('/');
    if (path.isAbsolute(entry) || parts.includes('..') || parts[0] !== expectedRoot) {
      throw new Error(
        `[expo-spm-plugin] ${tarballPath} must contain only ${expectedRoot}, found '${entry}'`
      );
    }
  }
}

function extractTarball(sourcePath, frameworkName, cacheDir, flavor) {
  const stat = fs.statSync(sourcePath);
  const destination = path.join(cacheDir, stableFrameworkId(frameworkName), flavor);
  const xcframeworkPath = path.join(destination, `${frameworkName}.xcframework`);
  const stampPath = path.join(destination, '.source.json');
  const stamp = `${JSON.stringify({
    path: fs.realpathSync(sourcePath),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
  })}\n`;

  try {
    if (
      fs.readFileSync(stampPath, 'utf8') === stamp &&
      fs.existsSync(path.join(xcframeworkPath, 'Info.plist'))
    ) {
      return xcframeworkPath;
    }
  } catch {}

  validateTarEntries(sourcePath, frameworkName);
  const temp = `${destination}.tmp-${process.pid}`;
  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });
  try {
    execFileSync('tar', ['-xzf', sourcePath, '-C', temp], { stdio: 'pipe' });
    const extracted = path.join(temp, `${frameworkName}.xcframework`);
    if (!fs.existsSync(path.join(extracted, 'Info.plist'))) {
      throw new Error(
        `[expo-spm-plugin] ${sourcePath} did not extract ${frameworkName}.xcframework/Info.plist`
      );
    }
    fs.writeFileSync(path.join(temp, '.source.json'), stamp, 'utf8');
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.renameSync(temp, destination);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  return xcframeworkPath;
}

function prepareArtifactSource(source, frameworkName, cacheDir, flavor) {
  if (source.type === 'tarball') {
    return extractTarball(source.path, frameworkName, cacheDir, flavor);
  }
  return path.resolve(source.path);
}

function validateFlavoredFramework(framework) {
  if (
    framework == null ||
    typeof framework !== 'object' ||
    typeof framework.id !== 'string' ||
    !/^[A-Za-z0-9_.-]+$/.test(framework.id) ||
    typeof framework.frameworkName !== 'string' ||
    framework.frameworkName.length === 0 ||
    framework.linkage !== 'dynamic' ||
    framework.flavors == null ||
    typeof framework.flavors !== 'object'
  ) {
    throw new Error(
      '[expo-spm-plugin] flavored framework declarations require a stable id, frameworkName, ' +
        'linkage="dynamic", and debug/release paths'
    );
  }

  const normalized = {};
  for (const flavor of FLAVORS) {
    const value = framework.flavors[flavor];
    if (typeof value !== 'string' || !path.isAbsolute(value)) {
      throw new Error(
        `[expo-spm-plugin] ${framework.frameworkName} ${flavor} path must be absolute`
      );
    }
    if (path.basename(value) !== `${framework.frameworkName}.xcframework`) {
      throw new Error(
        `[expo-spm-plugin] ${framework.frameworkName} ${flavor} path must identify ` +
          `${framework.frameworkName}.xcframework: ${value}`
      );
    }
    if (!fs.existsSync(path.join(value, 'Info.plist'))) {
      throw new Error(
        `[expo-spm-plugin] ${framework.frameworkName} ${flavor} XCFramework is incomplete: ${value}`
      );
    }
    normalized[flavor] = path.resolve(value);
  }

  return {
    id: framework.id,
    frameworkName: framework.frameworkName,
    linkage: 'dynamic',
    flavors: normalized,
  };
}

/**
 * Returns null when this module has no precompiled artifact at all. Once any
 * flavor is present, both are mandatory at the same source base; a partial
 * build must not silently degrade to a one-flavor declaration.
 */
function resolveFlavoredFramework({ packageName, moduleRoot, frameworkName, cacheDir }) {
  for (const baseDir of artifactBaseDirs(packageName, moduleRoot)) {
    const sources = Object.fromEntries(
      FLAVORS.map((flavor) => [flavor, existingArtifactSource(baseDir, flavor, frameworkName)])
    );
    if (sources.debug == null && sources.release == null) {
      continue;
    }
    for (const flavor of FLAVORS) {
      if (sources[flavor] == null) {
        throw new Error(
          `[expo-spm-plugin] ${frameworkName} has an incomplete precompiled pair in ${baseDir}: ` +
            `missing ${flavor}. Run the Expo prebuild pipeline for both Debug and Release ` +
            'before react-native spm update.'
        );
      }
    }
    return validateFlavoredFramework({
      id: stableFrameworkId(frameworkName),
      frameworkName,
      linkage: 'dynamic',
      flavors: {
        debug: prepareArtifactSource(sources.debug, frameworkName, cacheDir, 'debug'),
        release: prepareArtifactSource(sources.release, frameworkName, cacheDir, 'release'),
      },
    });
  }
  return null;
}

function copyFileIfLarger(source, destination) {
  let shouldCopy = true;
  try {
    shouldCopy = fs.statSync(source).size > fs.statSync(destination).size;
  } catch {}
  if (shouldCopy) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
}

function mergeDirectory(source, destination) {
  if (!fs.existsSync(source)) return;
  for (const entry of fs
    .readdirSync(source, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const src = path.join(source, entry.name);
    const dst = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      mergeDirectory(src, dst);
    } else if (entry.isFile()) {
      copyFileIfLarger(src, dst);
    }
  }
}

/**
 * Creates a compile-only framework search tree. It contains public headers,
 * module maps, and every slice's Swift module interfaces, but deliberately no
 * Mach-O binaries. Expo source products compile against this invariant tree;
 * RN owns all runtime linking and embedding of the flavored binaries.
 */
function prepareCompileInterfaces(frameworks, destination) {
  const temp = `${destination}.tmp-${process.pid}`;
  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });
  try {
    for (const framework of [...frameworks].sort((a, b) => a.id.localeCompare(b.id))) {
      const source = framework.flavors.debug;
      const sliceFrameworks = fs
        .readdirSync(source, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(source, entry.name, `${framework.frameworkName}.framework`))
        .filter((candidate) => fs.existsSync(candidate))
        .sort();
      if (sliceFrameworks.length === 0) {
        throw new Error(
          `[expo-spm-plugin] ${source} has no ${framework.frameworkName}.framework slices`
        );
      }
      const target = path.join(temp, `${framework.frameworkName}.framework`);
      for (const slice of sliceFrameworks) {
        mergeDirectory(path.join(slice, 'Headers'), path.join(target, 'Headers'));
        mergeDirectory(path.join(slice, 'Modules'), path.join(target, 'Modules'));
        if (fs.existsSync(path.join(slice, 'Info.plist'))) {
          copyFileIfLarger(path.join(slice, 'Info.plist'), path.join(target, 'Info.plist'));
        }
      }
    }
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.renameSync(temp, destination);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  return destination;
}

module.exports = {
  FLAVORS,
  artifactBaseDirs,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  stableFrameworkId,
  validateFlavoredFramework,
};
