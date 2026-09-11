import path from 'path';
import resolveFrom from 'resolve-from';

export interface BabelPluginConfig {
  file?: {
    request?: string;
    resolved?: string;
  };
  options?: unknown;
}

interface BabelPartialConfig {
  options: {
    plugins?: readonly BabelPluginConfig[];
  };
}

interface BabelCore {
  loadPartialConfigSync(options: {
    cwd: string;
    filename: string;
    root: string;
  }): BabelPartialConfig | null;
}

export function loadBabelConfigPlugins(projectRoot: string): readonly BabelPluginConfig[] | null {
  try {
    const expoPackageJsonPath = resolveFrom.silent(projectRoot, 'expo/package.json');
    if (!expoPackageJsonPath) {
      return null;
    }

    // Resolve the Babel version used by the project's Expo Metro config. This mirrors the nested
    // project-relative resolution in metroConfigLoader and works with non-hoisted installations.
    const metroConfigPackageJsonPath = resolveFrom.silent(
      path.dirname(expoPackageJsonPath),
      '@expo/metro-config/package.json'
    );
    if (!metroConfigPackageJsonPath) {
      return null;
    }

    const babelCorePath = resolveFrom.silent(
      path.dirname(metroConfigPackageJsonPath),
      '@babel/core'
    );
    if (!babelCorePath) {
      return null;
    }

    const babelCore = require(babelCorePath) as BabelCore;
    const partialConfig = babelCore.loadPartialConfigSync({
      cwd: projectRoot,
      filename: path.join(projectRoot, 'index.js'),
      root: projectRoot,
    });
    return partialConfig?.options.plugins ?? null;
  } catch {
    return null;
  }
}
