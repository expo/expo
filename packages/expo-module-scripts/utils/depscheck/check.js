// @ts-check
import path from 'node:path';

import { getPackageName, getSourceFileImports, getSourceFilesAsync, isNCCBuilt } from './scan.js';

/**
 * @typedef {{
 *   name: string,
 *   version?: string,
 *   bin?: unknown,
 *   scripts?: Record<string, string>,
 *   dependencies?: Record<string, string>,
 *   devDependencies?: Record<string, string>,
 *   peerDependencies?: Record<string, string>,
 * }} PackageJson
 *
 * The three levels of which dangerous dependencies are allowed.
 * @remarks
 * We can configure selectively invalid dependencies to be allowed in `SPECIAL_DEPENDENCIES` below.
 * - `types-only` means we allow any type-only import
 * - `ignore` means we allow any import, as long as the dependency isn't just a dev dependency
 * - `ignore-dev` means we allow any import at all times
 * The `ignore` and `ignore-dev` values are inherently dangerous and may cause broken
 * dependency chains in user projects!
 * @typedef {'types-only' | 'ignore' | 'ignore-dev'} IgnoreKind
 *
 * @typedef {import('./scan.js').SourceFileImportRef} SourceFileImportRef
 * @typedef {import('./scan.js').PackageCheckType} PackageCheckType
 */

/** Package dependency kinds, mapped to their `package.json` field names. */
const DependencyKind = {
  Normal: 'dependencies',
  Dev: 'devDependencies',
  Peer: 'peerDependencies',
};

/** @type {string[]} */
const IGNORED_PACKAGES = [
  'sqlite-inspector-webui', // This is prebuilt devtools plugin webui. It's not a user depended package.
];

/** @type {Record<string, Record<string, IgnoreKind | undefined> | undefined>} */
const SPECIAL_DEPENDENCIES = {
  'expo-dev-menu': {
    'react-native': 'ignore', // WARN: May need a peer dependency for react-native
  },
  'expo-modules-test-core': {
    typescript: 'ignore-dev', // TODO: Should probably be a peer dep
  },

  '@expo/cli': {
    eslint: 'ignore-dev', // TODO: Switch to resolve-from / project root require
    'expo-constants/package.json': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
    'metro-runtime/package.json': 'ignore-dev', // NOTE: Only used in development in the expo/expo monorepo
  },

  'expo-router': {
    'react-native-tab-view': 'ignore-dev', // TODO: Should be a peer dep, but it's only used in the MaterialTopTabs which is gated behind a try/catch require, so it's not inherently dangerous
  },

  '@expo/image-utils': {
    sharp: 'ignore-dev', // TODO: Mark as optional peer dep, if that's the intention
    'sharp-cli': 'ignore-dev',
  },

  '@expo/metro-config': {
    'babel-preset-expo': 'ignore-dev', // TODO: Remove; only used as a fallback for now
  },

  'jest-expo': {
    'babel-preset-expo': 'ignore-dev', // TODO: Remove; only used as a fallback for now
    expo: 'ignore-dev', // NOTE: Not resolvable without introducing a circular dependency
  },

  '@expo/metro-runtime': {
    'expo-constants': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
  },

  'expo-store-review': {
    'expo-constants': 'ignore-dev', // TODO: Should probably be a peer, but it's both installed in templates and also a dep of expo (needs discussion)
  },

  '@expo/log-box': {
    'react-dom': 'ignore-dev', // TODO: This peer dependency was removed due to this chain installing `react-dom`: `@expo/router-server -> @expo/log-box -> react-dom` which is not intended
  },

  'babel-preset-expo': {
    '@babel/core': 'types-only',
    '@expo/metro-config/build/babel-transformer': 'types-only',
    'react-native-worklets/plugin': 'ignore-dev', // Checked via hasModule before requiring
    'react-native-reanimated/plugin': 'ignore-dev', // Checked via hasModule before requiring
  },
};

// NOTE: These are globally ignored dependencies, and this list shouldn't ever get longer.
/** @type {Record<string, IgnoreKind | undefined>} */
const IGNORED_IMPORTS = {
  'expo-modules-core': 'ignore-dev',
  'expo-asset': 'ignore-dev',
};

const WORKSPACE_SPECIFIER = 'workspace:';

/**
 * Logger interface so the caller controls verbosity (e.g. `console` with a verbose flag).
 * @typedef {{ warn: (message: string) => void, verbose: (message: string) => void }} DepsLogger
 */

/**
 * Checks whether the package has valid dependency chains for each (external) import.
 *
 * @param {{ packageName: string, packagePath: string, packageJson: PackageJson }} pkg Package to check
 * @param {PackageCheckType} [type] What part of the package needs to be checked
 * @param {DepsLogger} [logger]
 * @returns {Promise<void>}
 */
export async function checkDependenciesAsync(pkg, type = 'package', logger = defaultLogger) {
  if (isNCCBuilt(pkg.packageJson)) {
    return;
  }

  // We still run checks on ignored packages, since we want to ensure disallowed
  // packages are never used.
  const isIgnoredPackage = IGNORED_PACKAGES.includes(pkg.packageName);

  const sources = (await getSourceFilesAsync(pkg.packagePath, type))
    .filter((file) => file.type === 'source')
    .map((file) => ({ file, importRefs: getSourceFileImports(file) }));

  if (!sources.length) {
    return;
  }

  const validator = createExternalImportValidator(pkg.packageName, pkg.packageJson);
  /** @type {{ file: { path: string }, importRef: SourceFileImportRef, kind: string | undefined }[]} */
  let invalidImports = [];

  /** @type {string[]} */
  const invalidDependencyRanges = [];

  for (const source of sources) {
    for (const importRef of source.importRefs) {
      if (importRef.type !== 'external' || pkg.packageName === importRef.packageName) {
        continue;
      } else if (isDisallowedImport(importRef)) {
        invalidImports.push({ file: source.file, importRef, kind: undefined });
      } else if (isIgnoredPackage) {
        continue;
      }
      if (validator.isPinnedDependencyRange(importRef)) {
        invalidDependencyRanges.push(importRef.packageName);
      }
      const kind = validator.getValidExternalImportKind(importRef);
      if (!kind || kind === DependencyKind.Dev) {
        invalidImports.push({ file: source.file, importRef, kind });
      }
    }
  }

  const config = SPECIAL_DEPENDENCIES[pkg.packageName];
  // Filter out ignored imports per package
  invalidImports = invalidImports.filter(({ importRef, kind }) => {
    let ignoreKind = config?.[importRef.importValue];
    if (!ignoreKind) {
      // if we can't find an ignore kind for the import, we try just the package name
      const packageName = getPackageName(importRef.importValue);
      ignoreKind = config?.[packageName];
      if (!ignoreKind) {
        // if we still don't find an exception, we see if it's a global exception
        ignoreKind = IGNORED_IMPORTS[importRef.importValue] ?? IGNORED_IMPORTS[packageName];
      }
    }
    switch (ignoreKind) {
      case 'types-only':
        return !importRef.isTypeOnly;
      case 'ignore':
        return kind !== DependencyKind.Dev;
      case 'ignore-dev':
        return false;
      default:
        return true;
    }
  });

  if (invalidImports.length) {
    const importAreTypesOnly = invalidImports.every(({ importRef }) => importRef.isTypeOnly);
    const importPackageNames = [
      ...new Set(invalidImports.map(({ importRef }) => importRef.packageName).sort()),
    ];

    const checkStateText = importAreTypesOnly ? 'Risky' : 'Invalid';
    const dependencyText = importPackageNames.length === 1 ? 'dependency' : 'dependencies';

    logger.warn(`📦 ${checkStateText} ${dependencyText}: ${importPackageNames.join(', ')}`);

    invalidImports.forEach(({ file, importRef }) => {
      logger.verbose(
        `     > ${path.relative(pkg.packagePath, file.path)} - ${importRef.importValue}` +
          `${importRef.isTypeOnly ? ' (types only)' : ''}` +
          `${isDisallowedImport(importRef) ? ' (disallowed)' : ''}`
      );
    });

    if (!importAreTypesOnly) {
      throw new Error(`${pkg.packageName} has invalid dependency chains.`);
    }
  }

  if (invalidDependencyRanges.length) {
    logger.warn(`📦 Risky versions: ${invalidDependencyRanges.join(', ')} are pinned!`);
    throw new Error(`${pkg.packageName} has invalid pinned versions.`);
  }
}

/**
 * @param {SourceFileImportRef} ref
 * @returns {boolean}
 */
function isDisallowedImport(ref) {
  const packageName = getPackageName(ref.packageName);
  return packageName === 'metro' || packageName.startsWith('metro-');
}

/**
 * Return the declared dependencies of a package, by kind.
 * @param {PackageJson} packageJson
 * @param {string[]} kinds
 * @returns {{ name: string, kind: string, versionRange: string }[]}
 */
function getDependencies(packageJson, kinds) {
  /** @type {{ name: string, kind: string, versionRange: string }[]} */
  const result = [];
  const fields = /** @type {Record<string, Record<string, string> | undefined>} */ (
    /** @type {unknown} */ (packageJson)
  );
  for (const kind of kinds) {
    const deps = fields[kind];
    if (deps) {
      for (const [name, versionRange] of Object.entries(deps)) {
        result.push({ name, kind, versionRange: /** @type {string} */ (versionRange) });
      }
    }
  }
  return result;
}

/**
 * Create a filter guard that validates any import reference against the package dependencies.
 * The filter only returns valid imports by checking:
 *   - If the imported package is an external import (e.g. importing a package)
 *   - If the imported package name is equal to the current package name (e.g. for scripts)
 *   - If the imported package name is in the dependencies, devDependencies, or peerDependencies
 * @param {string} packageName
 * @param {PackageJson} packageJson
 */
function createExternalImportValidator(packageName, packageJson) {
  /** @type {Map<string, { name: string, kind: string, versionRange: string }>} */
  const dependencyMap = new Map();
  const dependencies = getDependencies(packageJson, [
    DependencyKind.Normal,
    DependencyKind.Dev,
    DependencyKind.Peer,
  ]);
  dependencies.forEach((dependency) => dependencyMap.set(dependency.name, dependency));

  const seenDependencyName = new Set();
  return {
    /** @param {SourceFileImportRef} ref */
    getValidExternalImportKind(ref) {
      return dependencyMap.get(ref.packageName)?.kind;
    },
    /** @param {SourceFileImportRef} ref */
    isPinnedDependencyRange(ref) {
      // List of exceptions:
      if (packageName === 'patch-project' || packageName.startsWith('@expo/')) {
        // Ignore this project
        return null;
      } else if (ref.packageName.startsWith('@expo/')) {
        // Internal packages are ignored
        return null;
      } else if (ref.packageName.startsWith('@react-native/')) {
        // Sub-deps on react-native, fine to pin
        return null;
      } else if (ref.packageName === 'xml2js') {
        // TODO: Unpin
        return null;
      } else if (packageName === 'expo' && ref.packageName === 'expo-modules-core') {
        // TODO: Exception, but there's potentially no need for this
        return null;
      } else if (
        packageName === 'expo-dev-client' &&
        (ref.packageName === 'expo-dev-launcher' || ref.packageName === 'expo-dev-menu')
      ) {
        // TODO: Unpin
        return null;
      }

      if (seenDependencyName.has(ref.packageName)) {
        return null;
      }
      seenDependencyName.add(ref.packageName);
      const dependency = dependencyMap.get(ref.packageName);
      if (dependency && dependency.kind !== DependencyKind.Dev) {
        let { versionRange } = dependency;
        if (versionRange.startsWith(WORKSPACE_SPECIFIER)) {
          versionRange = versionRange.slice(WORKSPACE_SPECIFIER.length);
        }
        // NOTE: Loose check to see if a dependency is pinned
        const isLoose = /[~|^><=](\s*\d+\.)/.test(versionRange) || versionRange === '*';
        const isPrerelease = versionRange.includes('-');
        const isPinned = /^\d+\.\d+\.\d+$/.test(versionRange);
        return !isPrerelease && (!isLoose || isPinned);
      }
      return null;
    },
  };
}

/** @type {DepsLogger} */
const defaultLogger = {
  warn: (message) => console.warn(message),
  verbose: () => {},
};
