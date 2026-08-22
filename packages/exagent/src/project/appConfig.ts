// @ref llp/0004-smart-start-and-project-state.rfc.md
// Reading the config plugins of a project from its static app config.
//
// Only `app.json` and `app.config.json` are read. A dynamic `app.config.js`/`.ts` would have to
// be evaluated to learn its plugins, which runs project code inside the CLI — the process
// boundary of llp/0001 §Constraints item 5 exists to avoid exactly that. For a project with only
// a dynamic config, `plugins` is empty and `dynamic` is true, so callers can report the plugin
// answer as unknown instead of as "no plugins". Resolving those plugins is a job for an
// `expo config` subprocess, tracked as follow-up work.
import path from 'path';

import { fileExistsAsync } from '../utils/dir';
import { parsePackageNameFromModulePath, readJsonFileAsync } from './nodeModules';

/** One entry of the app config `plugins` array. */
export interface AppConfigPlugin {
  /** The entry as written in the config, e.g. `expo-build-properties`. */
  id: string;
  /** The package the plugin comes from, or `null` for a file inside the project. */
  packageName: string | null;
}

export interface StaticAppConfig {
  /** File the plugins were read from, relative to the project root. Null when there is none. */
  source: string | null;
  plugins: AppConfigPlugin[];
  /** A dynamic app config exists, so {@link plugins} may be incomplete. */
  dynamic: boolean;
}

/** Static config files, in the order the Expo config resolves them. */
const STATIC_CONFIG_FILES = ['app.json', 'app.config.json'];

/** Dynamic config files, which are never evaluated here. */
const DYNAMIC_CONFIG_FILES = ['app.config.ts', 'app.config.js', 'app.config.mjs', 'app.config.cjs'];

/** Read the config plugins declared in the project's static app config. */
export async function readStaticAppConfigAsync(projectRoot: string): Promise<StaticAppConfig> {
  const dynamic = (
    await Promise.all(
      DYNAMIC_CONFIG_FILES.map((file) => fileExistsAsync(path.join(projectRoot, file)))
    )
  ).some(Boolean);

  for (const file of STATIC_CONFIG_FILES) {
    const contents = await readJsonFileAsync<Record<string, any>>(path.join(projectRoot, file));
    if (contents == null) {
      continue;
    }
    // Both `{ "expo": { ... } }` and a bare config object are valid.
    const config = (contents.expo ?? contents) as { plugins?: unknown };
    return { source: file, plugins: parsePlugins(config.plugins), dynamic };
  }

  return { source: null, plugins: [], dynamic };
}

/** Normalize the `plugins` array, whose entries are a module path or `[path, options]`. */
function parsePlugins(plugins: unknown): AppConfigPlugin[] {
  if (!Array.isArray(plugins)) {
    return [];
  }

  const parsed: AppConfigPlugin[] = [];
  for (const entry of plugins) {
    const id = typeof entry === 'string' ? entry : Array.isArray(entry) ? entry[0] : null;
    if (typeof id !== 'string' || !id) {
      continue;
    }
    parsed.push({ id, packageName: parsePackageNameFromModulePath(id) });
  }
  return parsed;
}
