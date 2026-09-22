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

/**
 * Byte order, the order CocoaPods sorts in. Declaration order reaches the build:
 * it decides which contributor a colliding artifact is taken from, so it must not
 * vary with the machine's locale.
 */
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
 * Candidate directories for precompiled output, in lookup order: the path
 * override, the monorepo prebuild output, then the copy bundled into the npm
 * package at `moduleRoot`. `buildPath` is relative to a prebuild output root,
 * `bundledPath` to the package's `prebuilds` directory.
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
    throw new Error(`[expo-spm-plugin] ${tarballPath} is empty`);
  }
  const roots = new Set();
  for (const entry of entries) {
    const parts = entry.split('/');
    if (path.isAbsolute(entry) || parts.includes('..')) {
      throw new Error(
        `[expo-spm-plugin] ${tarballPath} holds the unsafe path '${entry}'. Extracting it would ` +
          'write outside the plugin cache, so the archive is not a precompiled Expo artifact. ' +
          'Delete it and rebuild or re-download the precompiled module.'
      );
    }
    if (!/.+\.xcframework$/.test(parts[0])) {
      throw new Error(
        `[expo-spm-plugin] in ${tarballPath}, '${entry}' is not part of an .xcframework. ` +
          'A flavor tarball holds only XCFramework directories, so this archive was packed by ' +
          'something other than the Expo prebuild pipeline. Delete it and rebuild or ' +
          're-download the precompiled module.'
      );
    }
    roots.add(parts[0]);
  }
  if (!roots.has(expectedRoot)) {
    throw new Error(
      `[expo-spm-plugin] ${tarballPath} does not contain ${expectedRoot}; it holds ` +
        `${Array.from(roots).sort().join(', ')}. The tarball belongs to a different product or ` +
        'the prebuild for this one did not finish. Rebuild the module with the Expo prebuild ' +
        'pipeline, or re-download its precompiled artifacts.'
    );
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
      throw new Error(
        `[expo-spm-plugin] ${sourcePath} did not extract ${frameworkName}.xcframework/Info.plist`
      );
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

/**
 * Candidate parents (each holding `<flavor>/<Dep>.xcframework`) for a SwiftPM
 * package a precompiled module links. The bundled copy lives in the npm package
 * of the module that links it.
 */
function spmDependencyBaseDirs(depName, ownerModuleRoot) {
  return precompiledBaseDirs(['.spm-deps', depName], ownerModuleRoot, ['spm-deps', depName]);
}

/**
 * A dependency copied verbatim from an upstream `.binaryTarget` can be a static
 * library, and one built from a package whose product is named differently ships
 * a differently named framework. Both reach RN and the interface tree as a slice
 * that is not `<Dep>.framework`, and fail there with a message naming neither the
 * dependency nor the module that pulled it in — so they are rejected here.
 */
function readXcframeworkPlist(plistPath) {
  try {
    return JSON.parse(
      execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], { encoding: 'utf8' })
    );
  } catch (error) {
    throw new Error(
      `[expo-spm-plugin] ${plistPath} could not be read as a property list: ${error.message}. ` +
        'An XCFramework keeps the list of what it holds there, so this one is damaged or was ' +
        'never an XCFramework. Delete it and rebuild the dependency with the Expo prebuild ' +
        'pipeline, or reinstall the package that ships it.',
      { cause: error }
    );
  }
}

function assertEmbeddableFramework(depName, xcframeworkPath) {
  const plistPath = path.join(xcframeworkPath, 'Info.plist');
  const plist = readXcframeworkPlist(plistPath);
  if (plist.AvailableLibraries != null && !Array.isArray(plist.AvailableLibraries)) {
    throw new Error(
      `[expo-spm-plugin] ${plistPath} lists AvailableLibraries as something other than a list of ` +
        'slices, so the plugin cannot tell what the XCFramework holds. The artifact is damaged. ' +
        'Delete it and rebuild the dependency with the Expo prebuild pipeline, or reinstall the ' +
        'package that ships it.'
    );
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
    throw new Error(
      `[expo-spm-plugin] ${depName} does not ship a ${expected}: ${xcframeworkPath} holds ` +
        `${found}. React Native links and embeds Expo's precompiled dependencies as dynamic ` +
        'frameworks named after the product, so a static library, a differently named framework ' +
        'and an XCFramework without slices are all unusable. Rebuild the dependency with the ' +
        "Expo prebuild pipeline, or exclude the Expo module that links it in your app's " +
        'package.json: "expo": { "autolinking": { "exclude": [...] } }.'
    );
  }
}

/**
 * XCFrameworks are directories; a stale file of the same name is not one. Only an
 * absent path counts as "not built here" — swallowing every error would make an
 * unreadable one look identical to a missing artifact, and the app would be built
 * without a dependency it links.
 */
function isDirectory(candidate) {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return false;
    }
    throw new Error(
      `[expo-spm-plugin] ${candidate} could not be read: ${error.message}. The plugin cannot ` +
        'tell whether a precompiled dependency is there, and it will not silently build an app ' +
        'without one. Make that path readable — or delete it and rebuild the dependency with ' +
        'the Expo prebuild pipeline — then run `npx react-native spm update` again.',
      { cause: error }
    );
  }
}

/**
 * RN embeds every flavored framework into the app bundle, so it rejects the whole
 * autolinking result when two declarations share an id or a framework name. Two
 * distinct products can collide after `stableFrameworkId` (Foo and ExpoFoo both
 * become expo-foo), and a dependency can carry the name of a module, so the check
 * belongs on the combined array rather than on either source.
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
        throw new Error(
          `[expo-spm-plugin] ${describe(previous)} and ${describe(framework)} both declare the ` +
            `${label} "${framework[key]}". React Native embeds each flavored framework once and ` +
            'rejects the whole autolinking graph over a collision, so no Expo module would ' +
            'build. ' +
            "Exclude the Expo module that brings in one of the two in your app's package.json: " +
            '"expo": { "autolinking": { "exclude": [...] } }, and report the pair at ' +
            'https://github.com/expo/expo/issues — one of the two products has to be renamed.'
        );
      }
      seen.set(framework[key], framework);
    }
  }
}

/**
 * Returns null when the dependency has no artifact anywhere. Each flavor walks
 * the full candidate list on its own, so a partial monorepo build cannot shadow
 * a complete bundled copy — CocoaPods resolves it the same way in
 * `expo-modules-autolinking/scripts/ios/precompiled_modules.rb`.
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
      throw new Error(
        `[expo-spm-plugin] ${depName} has no ${flavor} XCFramework, although its ` +
          `${resolved[0]} one resolved. Expo declares its precompiled dependencies as immutable ` +
          'pairs, so half a pair would link in one configuration and fail to launch in the other ' +
          `with dyld "Library not loaded: @rpath/${depName}.framework/${depName}". Build the ` +
          'dependency for both flavors with the Expo prebuild pipeline, or install a package ' +
          `that ships both. Searched: ${bases.join(', ')}.`
      );
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
 * The SwiftPM packages the precompiled modules link (SDWebImage, ZXingObjC, …),
 * each shipped as its own XCFramework beside the module.
 *
 * Two modules can link the same package, and RN's flavored frameworks are a flat
 * app-wide array that rejects a repeated id or framework name, so each dependency
 * is declared exactly once. Its owner — the first consuming pod name in byte
 * order, as CocoaPods' `ensure_shared_spm_deps` picks it — is also the npm
 * package searched for a bundled copy, so the two installers must order names
 * identically. The other consumers need nothing: one declaration serves the whole
 * app.
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
