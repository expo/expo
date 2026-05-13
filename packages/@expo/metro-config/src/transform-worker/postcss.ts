/**
 * Copyright © 2023 650 Industries.
 * Copyright JS Foundation and other contributors
 *
 * https://github.com/webpack-contrib/postcss-loader/
 */
import JsonFile from '@expo/json-file';
import fs from 'fs';
import path from 'path';
import type { AcceptedPlugin, ProcessOptions, Processor } from 'postcss';
import resolveFrom from 'resolve-from';

import { tryRequireThenImport } from './utils/require';

type PostCSSInputConfig = {
  plugins?: any[];
  from?: string;
  to?: string;
  syntax?: string;
  map?: boolean;
  parser?: string;
  stringifier?: string;
};

const CONFIG_FILE_NAME = 'postcss.config';

const debug = require('debug')('expo:metro:transformer:postcss');

interface LoadedPipeline {
  processor: Processor;
  baseOptions: Omit<ProcessOptions, 'from' | 'to' | 'map'>;
  emitMap: boolean;
}

const loadPostcssPipelineAsync = (function () {
  let promise: Promise<LoadedPipeline | null> | null = null;
  return function _loadPostcssPipelineAsync(projectRoot: string) {
    if (promise == null) {
      promise = (async () => {
        const inputConfig = await resolvePostcssConfig(projectRoot);
        if (!inputConfig) return null;

        const { plugins, processOptions } = await parsePostcssConfigAsync(projectRoot, {
          config: inputConfig,
          resourcePath: projectRoot,
        });

        debug('options:', processOptions);
        debug('plugins:', plugins);

        const postcss = require('postcss') as typeof import('postcss');
        const { from: _from, to: _to, map: _map, ...baseOptions } = processOptions;
        return {
          processor: postcss.default(plugins),
          baseOptions,
          emitMap: inputConfig.map === true,
        };
      })();
    }
    return promise;
  };
})();

export async function transformPostCssModule(
  projectRoot: string,
  { src, filename }: { src: string; filename: string }
): Promise<{ src: string; hasPostcss: boolean }> {
  const pipeline = await loadPostcssPipelineAsync(projectRoot);
  if (!pipeline) {
    return { src, hasPostcss: false };
  }

  const { content } = await pipeline.processor.process(src, {
    ...pipeline.baseOptions,
    from: filename,
    to: filename,
    map: pipeline.emitMap ? { inline: true } : false,
  });

  return { src: content, hasPostcss: true };
}

async function parsePostcssConfigAsync(
  projectRoot: string,
  {
    resourcePath: file,
    config: { plugins: inputPlugins, map, parser, stringifier, syntax, ...config } = {},
  }: {
    resourcePath: string;
    config: PostCSSInputConfig;
  }
): Promise<{ plugins: AcceptedPlugin[]; processOptions: ProcessOptions }> {
  const factory = pluginFactory();

  factory(inputPlugins);
  // delete config.plugins;

  const plugins = [...factory()].map((item) => {
    const [plugin, options] = item;

    if (typeof plugin === 'string') {
      return loadPlugin(projectRoot, plugin, options, file);
    }

    return plugin;
  });

  if (config.from) {
    config.from = path.resolve(projectRoot, config.from);
  }

  if (config.to) {
    config.to = path.resolve(projectRoot, config.to);
  }

  const processOptions: Partial<ProcessOptions> = {
    from: file,
    to: file,
    map: false,
  };

  if (typeof parser === 'string') {
    try {
      processOptions.parser = await tryRequireThenImport(
        resolveFrom.silent(projectRoot, parser) ?? parser
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Loading PostCSS "${parser}" parser failed: ${error.message}\n\n(@${file})`
        );
      }
      throw error;
    }
  }

  if (typeof stringifier === 'string') {
    try {
      processOptions.stringifier = await tryRequireThenImport(
        resolveFrom.silent(projectRoot, stringifier) ?? stringifier
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(
          `Loading PostCSS "${stringifier}" stringifier failed: ${error.message}\n\n(@${file})`
        );
      }
      throw error;
    }
  }

  if (typeof syntax === 'string') {
    try {
      processOptions.syntax = await tryRequireThenImport(
        resolveFrom.silent(projectRoot, syntax) ?? syntax
      );
    } catch (error: any) {
      throw new Error(`Loading PostCSS "${syntax}" syntax failed: ${error.message}\n\n(@${file})`);
    }
  }

  if (map === true) {
    // https://github.com/postcss/postcss/blob/master/docs/source-maps.md
    processOptions.map = { inline: true };
  }

  return { plugins, processOptions };
}

function loadPlugin(projectRoot: string, plugin: string, options: unknown, file: string) {
  try {
    debug('load plugin:', plugin);

    // e.g. `tailwindcss`
    let loadedPlugin = require(resolveFrom(projectRoot, plugin));

    if (loadedPlugin.default) {
      loadedPlugin = loadedPlugin.default;
    }

    if (!options || !Object.keys(options).length) {
      return loadedPlugin;
    }

    return loadedPlugin(options);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Loading PostCSS "${plugin}" plugin failed: ${error.message}\n\n(@${file})`);
    }
    throw error;
  }
}

export function pluginFactory() {
  const listOfPlugins = new Map<string, any>();

  return (plugins?: any) => {
    if (typeof plugins === 'undefined') {
      return listOfPlugins;
    }

    if (Array.isArray(plugins)) {
      for (const plugin of plugins) {
        if (Array.isArray(plugin)) {
          const [name, options] = plugin;

          if (typeof name !== 'string') {
            throw new Error(
              `PostCSS plugin must be a string, but "${name}" was found. Verify the configuration is correct.`
            );
          }

          listOfPlugins.set(name, options);
        } else if (plugin && typeof plugin === 'function') {
          listOfPlugins.set(plugin, undefined);
        } else if (plugin) {
          const pluginKeys = Object.keys(plugin);

          if (
            pluginKeys.length === 1 &&
            pluginKeys[0] != null &&
            (typeof plugin[pluginKeys[0]] === 'object' ||
              typeof plugin[pluginKeys[0]] === 'boolean') &&
            plugin[pluginKeys[0]] !== null
          ) {
            const [name] = pluginKeys;
            const options = plugin[name];

            if (options === false) {
              listOfPlugins.delete(name);
            } else {
              listOfPlugins.set(name, options);
            }
          } else {
            listOfPlugins.set(plugin, undefined);
          }
        }
      }
    } else {
      const objectPlugins = Object.entries(plugins);

      for (const [name, options] of objectPlugins) {
        if (options === false) {
          listOfPlugins.delete(name);
        } else {
          listOfPlugins.set(name, options);
        }
      }
    }

    return listOfPlugins;
  };
}

export async function resolvePostcssConfig(
  projectRoot: string
): Promise<PostCSSInputConfig | null> {
  for (const ext of ['.mjs', '.js']) {
    const configPath = path.join(projectRoot, CONFIG_FILE_NAME + ext);
    if (fs.existsSync(configPath)) {
      debug('load file:', configPath);
      const config = await tryRequireThenImport<
        PostCSSInputConfig | Record<'default', PostCSSInputConfig>
      >(configPath);
      return 'default' in config ? config.default : config;
    }
  }

  const jsonConfigPath = path.join(projectRoot, CONFIG_FILE_NAME + '.json');
  if (fs.existsSync(jsonConfigPath)) {
    debug('load file:', jsonConfigPath);
    return JsonFile.read(jsonConfigPath, { json5: true });
  }

  return null;
}

export function getPostcssConfigHash(projectRoot: string): string | null {
  // TODO: Maybe recurse plugins and add versions to the hash in the future.
  const {
    stableHash,
  }: typeof import('@expo/metro/metro-cache') = require('@expo/metro/metro-cache');

  for (const ext of ['.mjs', '.js']) {
    const configPath = path.join(projectRoot, CONFIG_FILE_NAME + ext);
    if (fs.existsSync(configPath)) {
      return stableHash(fs.readFileSync(configPath, 'utf8')).toString('hex');
    }
  }

  const jsonConfigPath = path.join(projectRoot, CONFIG_FILE_NAME + '.json');
  if (fs.existsSync(jsonConfigPath)) {
    return stableHash(fs.readFileSync(jsonConfigPath, 'utf8')).toString('hex');
  }
  return null;
}
