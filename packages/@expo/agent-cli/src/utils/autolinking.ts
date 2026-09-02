import Module from 'module';
import path from 'path';

/** A package found in the project's dependency graph. */
export interface DependencyResolution {
  name: string;
  version: string;
  path: string;
  [prop: string]: unknown;
}

export interface DependenciesLinker {
  scanDependenciesRecursively(): Promise<Record<string, DependencyResolution | undefined>>;
}

/**
 * The slice of `expo-modules-autolinking/exports` that skill discovery uses. It is
 * declared here instead of imported, because the module is resolved from the user's
 * project at runtime and is not a dependency of `@expo/agent-cli`.
 */
export interface Autolinking {
  makeCachedDependenciesLinker(options: { projectRoot: string }): DependenciesLinker;
}

const AUTOLINKING_MODULE = 'expo/internal/unstable-autolinking-exports';

/**
 * Load the autolinking exports from the `expo` package installed in the user's project.
 *
 * `@expo/agent-cli` runs from outside the project (`npx @expo/agent-cli`, a global install), so a plain
 * `require` would resolve against the CLI's own dependencies and miss the project's SDK
 * version. Resolving from `projectRoot` also keeps the CLI on the same autolinking
 * implementation that `expo` itself uses.
 */
export function requireAutolinking(projectRoot: string): Autolinking {
  // `createRequire` needs a file path, not a directory, to anchor the resolution. It is
  // reached through `Module` because the bundler replaces a bare `createRequire()` call.
  const projectRequire = Module.createRequire(path.join(projectRoot, 'noop.js'));
  return projectRequire(AUTOLINKING_MODULE) as Autolinking;
}
