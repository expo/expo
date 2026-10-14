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

const { pluginError } = require('./diagnostics');

const FLAVORS = ['debug', 'release'];

/** CocoaPods' byte order: it picks which contributor wins a collision, so never locale-dependent. */
const byteOrder = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

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

/**
 * Lookup order: EXPO_PRECOMPILED_MODULES_PATH, monorepo prebuild output, the npm package's
 * `prebuilds/` copy.
 */
function precompiledBaseDirs(buildPath, moduleRoot, bundledPath) {
  const bases = [];
  if (process.env.EXPO_PRECOMPILED_MODULES_PATH) {
    bases.push(path.resolve(process.env.EXPO_PRECOMPILED_MODULES_PATH, ...buildPath));
  }
  bases.push(
    path.resolve(__dirname, '..', '..', '..', 'precompile', '.build', ...buildPath),
    path.join(moduleRoot, 'prebuilds', ...bundledPath)
  );
  return Array.from(new Set(bases));
}

function artifactBaseDirs(packageName, moduleRoot) {
  return precompiledBaseDirs([packageName, 'output'], moduleRoot, ['output']);
}

/**
 * A flavor tarball holds one xcframework root per product the prebuild packed:
 * the module itself plus any SwiftPM dependency bundled with it (for example
 * Lottie.xcframework inside lottie-react-native). Anything else is either an
 * unrelated archive or an extraction escape.
 */
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
    throw pluginError({ what: `${tarballPath} is empty` });
  }
  const roots = new Set();
  for (const entry of entries) {
    const parts = entry.split('/');
    if (path.isAbsolute(entry) || parts.includes('..')) {
      throw pluginError({
        what: `${tarballPath} holds the unsafe path '${entry}'.`,
        why: 'Extracting it would write outside the plugin cache, so the archive is not a precompiled Expo artifact.',
        how: 'Delete it and rebuild or re-download the precompiled module.',
      });
    }
    if (!/.+\.xcframework$/.test(parts[0])) {
      throw pluginError({
        what: `in ${tarballPath}, '${entry}' is not part of an .xcframework.`,
        why: 'A flavor tarball holds only XCFramework directories, so this archive was packed by something other than the Expo prebuild pipeline.',
        how: 'Delete it and rebuild or re-download the precompiled module.',
      });
    }
    roots.add(parts[0]);
  }
  if (!roots.has(expectedRoot)) {
    throw pluginError({
      what: `${tarballPath} does not contain ${expectedRoot}; it holds ${Array.from(roots).sort().join(', ')}.`,
      why: 'The tarball belongs to a different product or the prebuild for this one did not finish.',
      how: 'Rebuild the module with the Expo prebuild pipeline, or re-download its precompiled artifacts.',
    });
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
  replaceDirectory(destination, (temp) => {
    execFileSync('tar', ['-xzf', sourcePath, '-C', temp], { stdio: 'pipe' });
    const extracted = path.join(temp, `${frameworkName}.xcframework`);
    if (!fs.existsSync(path.join(extracted, 'Info.plist'))) {
      throw pluginError({
        what: `${sourcePath} did not extract ${frameworkName}.xcframework/Info.plist`,
      });
    }
    fs.writeFileSync(path.join(temp, '.source.json'), stamp, 'utf8');
  });
  return xcframeworkPath;
}

/**
 * Fills a sibling temp directory with `fill(temp)` and only then swaps it in for
 * `destination`, so a fill that throws leaves the previous contents untouched.
 */
function replaceDirectory(destination, fill) {
  const temp = `${destination}.tmp-${process.pid}`;
  fs.rmSync(temp, { recursive: true, force: true });
  fs.mkdirSync(temp, { recursive: true });
  try {
    fill(temp);
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.renameSync(temp, destination);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
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
    throw pluginError({
      what: 'flavored framework declarations require a stable id, frameworkName, linkage="dynamic", and debug/release paths',
    });
  }

  const normalized = {};
  for (const flavor of FLAVORS) {
    const value = framework.flavors[flavor];
    if (typeof value !== 'string' || !path.isAbsolute(value)) {
      throw pluginError({ what: `${framework.frameworkName} ${flavor} path must be absolute` });
    }
    if (path.basename(value) !== `${framework.frameworkName}.xcframework`) {
      throw pluginError({
        what: `${framework.frameworkName} ${flavor} path must identify ${framework.frameworkName}.xcframework: ${value}`,
      });
    }
    if (!fs.existsSync(path.join(value, 'Info.plist'))) {
      throw pluginError({
        what: `${framework.frameworkName} ${flavor} XCFramework is incomplete: ${value}`,
      });
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
        throw pluginError({
          what: `${frameworkName} has an incomplete precompiled pair in ${baseDir}: missing ${flavor}.`,
          how: 'Run the Expo prebuild pipeline for both Debug and Release before react-native spm update.',
        });
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

/**
 * Candidate parents (each holding `<flavor>/<Dep>.xcframework`) for a SwiftPM
 * package a precompiled module links. The bundled copy lives in the npm package
 * of the module that links it.
 */
function spmDependencyBaseDirs(depName, ownerModuleRoot) {
  return precompiledBaseDirs(['.spm-deps', depName], ownerModuleRoot, ['spm-deps', depName]);
}

function readXcframeworkPlist(plistPath) {
  try {
    return JSON.parse(
      execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], { encoding: 'utf8' })
    );
  } catch (error) {
    throw pluginError(
      {
        what: `${plistPath} could not be read as a property list: ${error.message}.`,
        why: 'An XCFramework keeps the list of what it holds there, so this one is damaged or was never an XCFramework.',
        how: 'Delete it and rebuild the dependency with the Expo prebuild pipeline, or reinstall the package that ships it.',
      },
      { cause: error }
    );
  }
}

/** Rejects a static library or misnamed framework here, where the error can name the dependency. */
function assertEmbeddableFramework(depName, xcframeworkPath) {
  const plistPath = path.join(xcframeworkPath, 'Info.plist');
  const plist = readXcframeworkPlist(plistPath);
  if (plist.AvailableLibraries != null && !Array.isArray(plist.AvailableLibraries)) {
    throw pluginError({
      what: `${plistPath} lists AvailableLibraries as something other than a list of slices, so the plugin cannot tell what the XCFramework holds.`,
      why: 'The artifact is damaged.',
      how: 'Delete it and rebuild the dependency with the Expo prebuild pipeline, or reinstall the package that ships it.',
    });
  }
  const libraries = plist.AvailableLibraries ?? [];
  const expected = `${depName}.framework`;
  const unusable = libraries
    .map((library) => library?.LibraryPath)
    .filter((libraryPath) => libraryPath !== expected);
  if (libraries.length === 0 || unusable.length > 0) {
    const found =
      unusable.map((libraryPath) => libraryPath ?? 'a slice with no LibraryPath').join(', ') ||
      'no library slices';
    throw pluginError({
      what: `${depName} does not ship a ${expected}: ${xcframeworkPath} holds ${found}.`,
      why: "React Native links and embeds Expo's precompiled dependencies as dynamic frameworks named after the product, so a static library, a differently named framework and an XCFramework without slices are all unusable.",
      how: 'Rebuild the dependency with the Expo prebuild pipeline, or exclude the Expo module that links it in your app\'s package.json: "expo": { "autolinking": { "exclude": [...] } }.',
    });
  }
}

/** Only ENOENT/ENOTDIR mean absent; other errors must not look like a missing artifact. */
function isDirectory(candidate) {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return false;
    }
    throw pluginError(
      {
        what: `${candidate} could not be read: ${error.message}.`,
        why: 'The plugin cannot tell whether a precompiled dependency is there, and it will not silently build an app without one.',
        how: 'Make that path readable — or delete it and rebuild the dependency with the Expo prebuild pipeline — then run `npx react-native spm update` again.',
      },
      { cause: error }
    );
  }
}

/**
 * RN rejects the whole graph on a repeated id/name (Foo and ExpoFoo both → expo-foo).
 * A dependency can carry a module's name, so this runs on the combined array.
 */
function assertDistinctFlavoredFrameworks(frameworks) {
  const describe = (framework) =>
    framework.flavors?.debug != null
      ? `${framework.frameworkName} (${framework.flavors.debug})`
      : framework.frameworkName;
  for (const [key, label] of [
    ['id', 'framework id'],
    ['frameworkName', 'framework name'],
  ]) {
    const seen = new Map();
    for (const framework of frameworks) {
      const previous = seen.get(framework[key]);
      if (previous != null) {
        throw pluginError({
          what: `${describe(previous)} and ${describe(framework)} both declare the ${label} "${framework[key]}".`,
          why: 'React Native embeds each flavored framework once and rejects the whole autolinking graph over a collision, so no Expo module would build.',
          how: 'Exclude the Expo module that brings in one of the two in your app\'s package.json: "expo": { "autolinking": { "exclude": [...] } }, and report the pair at https://github.com/expo/expo/issues — one of the two products has to be renamed.',
        });
      }
      seen.set(framework[key], framework);
    }
  }
}

/**
 * Null when no artifact exists. Each flavor walks all candidates, so a partial monorepo build
 * cannot shadow a complete bundled copy (as precompiled_modules.rb).
 */
function resolveSpmDependencyFramework(depName, ownerModuleRoot) {
  const bases = spmDependencyBaseDirs(depName, ownerModuleRoot);
  const flavors = {};
  for (const flavor of FLAVORS) {
    const base = bases.find((dir) => isDirectory(path.join(dir, flavor, `${depName}.xcframework`)));
    if (base != null) flavors[flavor] = path.join(base, flavor, `${depName}.xcframework`);
  }
  const resolved = FLAVORS.filter((flavor) => flavors[flavor] != null);
  if (resolved.length === 0) {
    return null;
  }
  for (const flavor of FLAVORS) {
    if (flavors[flavor] == null) {
      throw pluginError({
        what: `${depName} has no ${flavor} XCFramework, although its ${resolved[0]} one resolved.`,
        why: `Expo declares its precompiled dependencies as immutable pairs, so half a pair would link in one configuration and fail to launch in the other with dyld "Library not loaded: @rpath/${depName}.framework/${depName}".`,
        how: `Build the dependency for both flavors with the Expo prebuild pipeline, or install a package that ships both. Searched: ${bases.join(', ')}.`,
      });
    }
  }
  const framework = validateFlavoredFramework({
    id: stableFrameworkId(depName),
    frameworkName: depName,
    linkage: 'dynamic',
    flavors,
  });
  for (const flavor of FLAVORS) {
    assertEmbeddableFramework(depName, framework.flavors[flavor]);
  }
  return framework;
}

/**
 * One declaration per linked SwiftPM package; owner = first consumer pod in byte order
 * (CocoaPods' ensure_shared_spm_deps), searched for the bundled copy.
 * The two installers must order names identically.
 */
function resolveSpmDependencyFrameworks(consumers) {
  const owners = new Map();
  for (const consumer of consumers) {
    for (const depName of consumer.spmDependencies ?? []) {
      const owner = owners.get(depName);
      if (owner == null || consumer.podName < owner.podName) {
        owners.set(depName, consumer);
      }
    }
  }
  return [...owners.keys()]
    .sort()
    .map((depName) => resolveSpmDependencyFramework(depName, owners.get(depName).moduleRoot))
    .filter((framework) => framework != null);
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
    .sort((a, b) => byteOrder(a.name, b.name))) {
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
  replaceDirectory(destination, (temp) => {
    for (const framework of [...frameworks].sort((a, b) => byteOrder(a.id, b.id))) {
      const source = framework.flavors.debug;
      const sliceFrameworks = fs
        .readdirSync(source, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(source, entry.name, `${framework.frameworkName}.framework`))
        .filter((candidate) => fs.existsSync(candidate))
        .sort();
      if (sliceFrameworks.length === 0) {
        throw pluginError({ what: `${source} has no ${framework.frameworkName}.framework slices` });
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
  });
  return destination;
}

module.exports = {
  FLAVORS,
  artifactBaseDirs,
  assertDistinctFlavoredFrameworks,
  byteOrder,
  prepareCompileInterfaces,
  resolveFlavoredFramework,
  resolveSpmDependencyFrameworks,
  stableFrameworkId,
  validateFlavoredFramework,
};
