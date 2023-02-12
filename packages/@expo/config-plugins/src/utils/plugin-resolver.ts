import assert from 'assert';
import findUp from 'find-up';
import * as path from 'path';
import resolveFrom from 'resolve-from';

import { ConfigPlugin, StaticPlugin } from '../Plugin.types';
import { PluginError } from './errors';
import { fileExists } from './modules';

// Default plugin entry file name.
export const pluginFileName = 'app.plugin.js';

function findUpPackageJson(root: string): string {
  const packageJson = findUp.sync('package.json', { cwd: root });
  assert(packageJson, `No package.json found for module "${root}"`);
  return packageJson;
}

export function resolvePluginForModule(projectRoot: string, modulePath: string) {
  const resolved = resolveFrom.silent(projectRoot, modulePath);
  if (!resolved) {
    throw new PluginError(
      `Failed to resolve plugin for module "${modulePath}" relative to "${projectRoot}"`,
      'PLUGIN_NOT_FOUND'
    );
  }
  // If the modulePath is something like `@bacon/package/index.js` or `expo-foo/build/app`
  // then skip resolving the module `app.plugin.js`
  if (moduleNameIsDirectFileReference(modulePath)) {
    return { isPluginFile: false, filePath: resolved };
  }
  return findUpPlugin(resolved);
}

// TODO: Test windows
function pathIsFilePath(name: string): boolean {
  // Matches lines starting with: . / ~/
  return !!name.match(/^(\.|~\/|\/)/g);
}

export function moduleNameIsDirectFileReference(name: string): boolean {
  if (pathIsFilePath(name)) {
    return true;
  }

  const slashCount = name.split(path.sep)?.length;
  // Orgs (like @expo/config ) should have more than one slash to be a direct file.
  if (name.startsWith('@')) {
    return slashCount > 2;
  }

  // Regular packages should be considered direct reference if they have more than one slash.
  return slashCount > 1;
}

function resolveExpoPluginFile(root: string): string | null {
  // Find the expo plugin root file
  const pluginModuleFile = resolveFrom.silent(
    root,
    // use ./ so it isn't resolved as a node module
    `./${pluginFileName}`
  );

  // If the default expo plugin file exists use it.
  if (pluginModuleFile && fileExists(pluginModuleFile)) {
    return pluginModuleFile;
  }
  return null;
}

function findUpPlugin(root: string): { filePath: string; isPluginFile: boolean } {
  // Get the closest package.json to the node module
  const packageJson = findUpPackageJson(root);
  // resolve the root folder for the node module
  const moduleRoot = path.dirname(packageJson);
  // use whatever the initial resolved file was ex: `node_modules/my-package/index.js` or `./something.js`
  const pluginFile = resolveExpoPluginFile(moduleRoot);
  return { filePath: pluginFile ?? root, isPluginFile: !!pluginFile };
}

export function normalizeStaticPlugin(plugin: StaticPlugin | ConfigPlugin | string): StaticPlugin {
  if (Array.isArray(plugin)) {
    assert(
      plugin.length > 0 && plugin.length < 3,
      `Wrong number of arguments provided for static config plugin, expected either 1 or 2, got ${plugin.length}`
    );
    return plugin;
  }
  return [plugin, undefined];
}

export function assertInternalProjectRoot(projectRoot?: string): asserts projectRoot {
  assert(
    projectRoot,
    `Unexpected: Config \`_internal.projectRoot\` isn't defined by expo-cli, this is a bug.`
  );
}

// Resolve the module function and assert type
export function resolveConfigPluginFunction(projectRoot: string, pluginReference: string) {
  const { plugin } = resolveConfigPluginFunctionWithInfo(projectRoot, pluginReference);
  return plugin;
}

// Resolve the module function and assert type
export function resolveConfigPluginFunctionWithInfo(projectRoot: string, pluginReference: string) {
  const { filePath: pluginFile, isPluginFile } = resolvePluginForModule(
    projectRoot,
    pluginReference
  );
  let result: any;
  try {
    result = requirePluginFile(pluginFile);
  } catch (error) {
    if (error instanceof SyntaxError) {
      const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
      // If the plugin reference is a node module, and that node module has a syntax error, then it probably doesn't have an official config plugin.
      if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
        const pluginError = new PluginError(
          `Package "${pluginReference}" does not contain a valid config plugin.\n${learnMoreLink}\n\n${error.message}`,
          'INVALID_PLUGIN_IMPORT'
        );
        pluginError.stack = error.stack;
        throw pluginError;
      }
    }
    throw error;
  }

  const plugin = resolveConfigPluginExport({
    plugin: result,
    pluginFile,
    pluginReference,
    isPluginFile,
  });
  return { plugin, pluginFile, pluginReference, isPluginFile };
}

/**
 * - Resolve the exported contents of an Expo config (be it default or module.exports)
 * - Assert no promise exports
 * - Return config type
 * - Serialize config
 *
 * @param props.plugin plugin results
 * @param props.pluginFile plugin file path
 * @param props.pluginReference the string used to reference the plugin
 * @param props.isPluginFile is file path from the app.plugin.js module root
 */
export function resolveConfigPluginExport({
  plugin,
  pluginFile,
  pluginReference,
  isPluginFile,
}: {
  plugin: any;
  pluginFile: string;
  pluginReference: string;
  isPluginFile: boolean;
}): ConfigPlugin<unknown> {
  if (plugin.default != null) {
    plugin = plugin.default;
  }
  if (typeof plugin !== 'function') {
    const learnMoreLink = `Learn more: https://docs.expo.dev/guides/config-plugins/#creating-a-plugin`;
    // If the plugin reference is a node module, and that node module does not export a function then it probably doesn't have a config plugin.
    if (!isPluginFile && !moduleNameIsDirectFileReference(pluginReference)) {
      throw new PluginError(
        `Package "${pluginReference}" does not contain a valid config plugin. Module must export a function from file: ${pluginFile}\n${learnMoreLink}`,
        'INVALID_PLUGIN_TYPE'
      );
    }
    throw new PluginError(
      `Plugin "${pluginReference}" must export a function from file: ${pluginFile}. ${learnMoreLink}`,
      'INVALID_PLUGIN_TYPE'
    );
  }

  return plugin;
}

function requirePluginFile(filePath: string): any {
  try {
    return require(filePath);
  } catch (error) {
    // TODO: Improve error messages
    throw error;
  }
}
