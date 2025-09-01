import type {
  PluginOptions as EntryOptions,
  PluginTarget as EntryTarget,
  ConfigItem,
} from '@babel/core';
import generate from '@babel/generator';
import path from 'path';

import { importExportPlugin } from '../../import-export-plugin';
import { transformToAst } from '../__mocks__/test-helpers-upstream';

type PluginEntry =
  | EntryTarget
  | ConfigItem
  | [EntryTarget]
  | [EntryTarget, EntryOptions]
  | [EntryTarget, EntryOptions, string | void];

const baseOpts = {
  importAll: '_$$_IMPORT_ALL',
  importDefault: '_$$_IMPORT_DEFAULT',
};

export const makeEval = ({
  plugins = [importExportPlugin],
  ...rest
}: {
  plugins?: readonly PluginEntry[];
} = {}) => {
  return (code: string | { entry: string; [request: string]: string }) => {
    const input = {
      ...(typeof code !== 'string' ? code : {}),
      entry: typeof code === 'string' ? code : code.entry,
    };

    const modules = Object.create(null);
    const opts = { ...baseOpts, ...rest, liveBindings: true }

    function transform(code: string): string {
      return generate(transformToAst(plugins, code, opts)).code;
    }

    const importAll = (() => {
      const cache = new WeakMap<any, any>();
      return (request: string) => {
        const mod = require(request) as any;
        let output = cache.get(mod);
        if (!output) {
          output = {};
          if (mod && mod.__esModule) {
            output = mod;
          } else {
            output = {};
            if (mod) {
              for (const key in mod) {
                if (Object.prototype.hasOwnProperty.call(exports, key)) {
                  output[key] = exports[key];
                }
              }
            }
            output.default = exports;
          }
          cache.set(mod, output);
        }
        return output;
      };
    })();

    const importDefault = (() => {
      const cache = new WeakMap<any, any>();
      return (request: string) => {
        const mod = require(request) as any;
        let output = cache.get(mod);
        if (!output) {
          output = mod && mod.__esModule ? mod.default : mod;
          cache.set(mod, output);
        }
        return output;
      };
    })();

    function require(target: string): unknown {
      const request = input[path.normalize(target)] != null ? path.normalize(target) : target;
      if (input[request] == null) {
        throw new Error(`Unknown request: ${request}`);
      }
      const mod =
        modules[request] ||
        (modules[request] = {
          loaded: false,
          exports: Object.create(null),
          require,
          path: request,
        });
      if (!mod.loaded) {
        const code = transform(input[request]);
        // eslint-disable-next-line no-new-func
        const wrapper = new Function(
          'exports',
          'require',
          'module',
          '__filename',
          '__dirname',
          opts.importAll,
          opts.importDefault,
          code
        );
        const { exports, require, path: dirname } = mod;
        Reflect.apply(wrapper, exports, [exports, require, mod, request, dirname, importAll, importDefault]);
        mod.loaded = true;
      }
      return mod.exports;
    }

    const exports = require('entry') as any;
    const requests = Object.keys(modules).filter((x) => x !== 'entry');
    return { requests, exports };
  };
};
