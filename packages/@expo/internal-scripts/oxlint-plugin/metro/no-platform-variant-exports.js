import metroResolver from '@expo/metro/metro-resolver';
import fs from 'node:fs';
import { isBuiltin } from 'node:module';
import path from 'node:path';

const {
  resolve,
  FailedToResolveNameError,
  FailedToResolvePathError,
  FailedToResolveUnsupportedError,
  InvalidPackageError,
} = metroResolver;

// These values mirror the resolver settings in `@expo/metro-config` (`ExpoMetroConfig.ts`) and
// `@expo/cli` (`withMetroMultiPlatform.ts`).
const SOURCE_EXTS = ['ts', 'tsx', 'mjs', 'js', 'jsx', 'json', 'cjs'];
const PLATFORMS = {
  ios: {
    extensions: ['ios', 'native'],
    mainFields: ['react-native', 'browser', 'main'],
  },
  android: {
    extensions: ['android', 'native'],
    mainFields: ['react-native', 'browser', 'main'],
  },
  web: {
    extensions: ['web'],
    mainFields: ['browser', 'module', 'main'],
  },
};
const CONDITIONS_BY_PLATFORM = {
  ios: ['react-native'],
  android: ['react-native'],
  web: ['browser'],
};
// Git does not track `build/`. The `expo-source` condition makes workspace packages resolve to
// `src/`, which has the same platform files as `build/`.
const CONDITION_NAMES = ['expo-source'];

const SOURCE_EXT_SET = new Set(SOURCE_EXTS);
const FILE_NAME_PATTERN = new RegExp(
  `^(.+?)(?:\\.(ios|android|native|web))?\\.(?:${SOURCE_EXTS.join('|')})$`
);

const lookupCache = new Map();
const packageCache = new Map();
const directoryCache = new Map();
const resultCache = new Map();

function fileSystemLookup(filePath) {
  let result = lookupCache.get(filePath);
  if (!result) {
    try {
      const realPath = fs.realpathSync(filePath);
      const stats = fs.statSync(realPath);
      result = stats.isDirectory()
        ? { exists: true, type: 'd', realPath }
        : stats.isFile()
          ? { exists: true, type: 'f', realPath }
          : { exists: false };
    } catch {
      result = { exists: false };
    }
    lookupCache.set(filePath, result);
  }
  return result;
}

function doesFileExist(filePath) {
  const result = fileSystemLookup(filePath);
  return result.exists && result.type === 'f';
}

function getPackage(packageJsonPath) {
  let packageJson = packageCache.get(packageJsonPath);
  if (packageJson === undefined) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch {
      packageJson = null;
    }
    packageCache.set(packageJsonPath, packageJson);
  }
  return packageJson;
}

function getPackageForModule(absoluteModulePath) {
  let directory = absoluteModulePath;
  while (path.basename(directory) !== 'node_modules') {
    const packageJsonPath = path.join(directory, 'package.json');
    if (doesFileExist(packageJsonPath)) {
      const packageJson = getPackage(packageJsonPath);
      return packageJson
        ? {
            packageJson,
            rootPath: directory,
            packageRelativePath: path.relative(directory, absoluteModulePath),
          }
        : null;
    }
    const parent = path.dirname(directory);
    if (parent === directory) {
      break;
    }
    directory = parent;
  }
  return null;
}

function getFileNames(directory) {
  let fileNames = directoryCache.get(directory);
  if (!fileNames) {
    fileNames = fs.readdirSync(directory);
    directoryCache.set(directory, fileNames);
  }
  return fileNames;
}

function resolveForPlatform(originModulePath, specifier, platform, isESMImport) {
  const context = {
    allowHaste: false,
    assetExts: new Set(),
    customResolverOptions: {},
    dev: true,
    disableHierarchicalLookup: false,
    doesFileExist,
    extraNodeModules: null,
    fileSystemLookup,
    getPackage,
    getPackageForModule,
    isESMImport,
    mainFields: PLATFORMS[platform].mainFields,
    nodeModulesPaths: [],
    originModulePath,
    preferNativePlatform: platform !== 'web',
    resolveAsset: () => null,
    resolveHasteModule: () => null,
    resolveHastePackage: () => null,
    sourceExts: SOURCE_EXTS,
    unstable_conditionNames: CONDITION_NAMES,
    unstable_conditionsByPlatform: CONDITIONS_BY_PLATFORM,
    unstable_enablePackageExports: true,
    unstable_incrementalResolution: false,
    unstable_logWarning() {},
  };
  try {
    const resolution = resolve(context, specifier, platform);
    return resolution.type === 'sourceFile' ? resolution.filePath : null;
  } catch (error) {
    if (
      error instanceof FailedToResolveNameError ||
      error instanceof FailedToResolvePathError ||
      error instanceof FailedToResolveUnsupportedError ||
      error instanceof InvalidPackageError
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Returns the module name of `filePath` and the platform file that Metro prefers to `filePath` on
 * `platform`.
 */
function findIgnoredVariant(filePath, platform) {
  const match = FILE_NAME_PATTERN.exec(path.basename(filePath));
  if (!match) {
    return null;
  }
  const { extensions } = PLATFORMS[platform];
  const selected = match[2] ? extensions.indexOf(match[2]) : -1;
  const name = match[2] && selected === -1 ? `${match[1]}.${match[2]}` : match[1];
  const preferred = selected === -1 ? extensions : extensions.slice(0, selected);

  const fileNames = getFileNames(path.dirname(filePath));
  for (const extension of preferred) {
    const prefix = `${name}.${extension}.`;
    const variant = fileNames.find(
      (fileName) => fileName.startsWith(prefix) && SOURCE_EXT_SET.has(fileName.slice(prefix.length))
    );
    if (variant) {
      return { name, variant };
    }
  }
  return null;
}

/**
 * Returns the files that Metro resolves `specifier` to, each with the platform files that Metro
 * ignores. Metro selects a platform file only when it adds the file extension to a path.
 */
function findIgnoredVariants(originModulePath, specifier, isESMImport) {
  const key = `${path.dirname(originModulePath)}\0${specifier}\0${isESMImport}`;
  let ignored = resultCache.get(key);
  if (!ignored) {
    ignored = [];
    for (const platform of Object.keys(PLATFORMS)) {
      const resolved = resolveForPlatform(originModulePath, specifier, platform, isESMImport);
      const found = resolved && findIgnoredVariant(resolved, platform);
      if (!found) {
        continue;
      }
      const entry = ignored.find((item) => item.resolved === resolved);
      if (!entry) {
        ignored.push({ resolved, name: found.name, variants: [found.variant] });
      } else if (!entry.variants.includes(found.variant)) {
        entry.variants.push(found.variant);
      }
    }
    resultCache.set(key, ignored);
  }
  return ignored;
}

function isRelativeOrAbsolute(specifier) {
  return specifier.startsWith('.') || path.isAbsolute(specifier);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow imports that Metro resolves to an exact file when that file has a platform-specific variant.',
    },
    messages: {
      ignoredVariant:
        'Metro resolves "{{specifier}}" to "{{resolved}}" and ignores the platform files {{variants}}. Metro uses the exact file for a package "exports" target, a package "main" entry with a file extension, and a specifier with a file extension. Make the specifier resolve to a file that imports "./{{name}}" without a file extension.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.physicalFilename;

    function check(source, isESMImport) {
      if (!source || source.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const specifier = source.value;
      if (isBuiltin(specifier)) {
        return;
      }
      // Metro adds the platform to a relative specifier that has no source file extension.
      if (
        isRelativeOrAbsolute(specifier) &&
        !SOURCE_EXT_SET.has(path.extname(specifier).slice(1))
      ) {
        return;
      }
      for (const { resolved, name, variants } of findIgnoredVariants(
        filename,
        specifier,
        isESMImport
      )) {
        context.report({
          node: source,
          messageId: 'ignoredVariant',
          data: {
            specifier,
            resolved: path.relative(context.cwd, resolved),
            name,
            variants: variants.map((variant) => `"${variant}"`).join(', '),
          },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind !== 'type') {
          check(node.source, true);
        }
      },
      ExportNamedDeclaration(node) {
        if (node.exportKind !== 'type') {
          check(node.source, true);
        }
      },
      ExportAllDeclaration(node) {
        if (node.exportKind !== 'type') {
          check(node.source, true);
        }
      },
      ImportExpression(node) {
        check(node.source, true);
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1
        ) {
          check(node.arguments[0], false);
        }
      },
    };
  },
};
