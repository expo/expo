import type {
  PluginOptions as EntryOptions,
  PluginTarget as EntryTarget,
  ConfigItem,
} from '@babel/core';
import generate from '@babel/generator';
import path from 'path';

import { importExportLiveBindingsPlugin } from '../../index';
import { transformToAst } from '../__mocks__/test-helpers-upstream';

type PluginEntry =
  | EntryTarget
  | ConfigItem
  | [EntryTarget]
  | [EntryTarget, EntryOptions]
  | [EntryTarget, EntryOptions, string | void];

/**
 * Name of the `importDefault` helper the harness provides to evaluated modules. Passing this
 * as the plugin's `importDefault` option makes it emit calls to Metro's helper rather than the
 * self-contained interop wrapper.
 */
export const IMPORT_DEFAULT_NAME = '_$$_IMPORT_DEFAULT';

export const makeEval = ({
  plugins = [importExportLiveBindingsPlugin],
  ...rest
}: {
  plugins?: readonly PluginEntry[];
  /** Must be `IMPORT_DEFAULT_NAME`, which is the name the harness binds the helper to. */
  importDefault?: typeof IMPORT_DEFAULT_NAME;
} = {}) => {
  return (code: string | { entry: string; [request: string]: string }) => {
    const input: Record<string, string> = {
      ...(typeof code !== 'string' ? code : {}),
      entry: typeof code === 'string' ? code : code.entry,
    };

    const modules = Object.create(null);
    /** Distinguishes "not yet resolved" from a module whose default export is `undefined`. */
    const EMPTY = Symbol('empty');

    function transform(code: string): string {
      return generate(transformToAst(plugins, code, rest)).code;
    }

    function resolve(target: string): string {
      return input[path.normalize(target)] != null ? path.normalize(target) : target;
    }

    function require(target: string): unknown {
      const request = resolve(target);
      if (input[request] == null) {
        throw new Error(`Unknown request: ${request}`);
      }
      const mod =
        modules[request] ||
        (modules[request] = {
          loaded: false,
          exports: Object.create(null),
          importedDefault: EMPTY,
          require,
          path: request,
        });
      if (!mod.loaded) {
        mod.loaded = true;
        const code = transform(input[request]);
        // eslint-disable-next-line no-new-func
        const wrapper = new Function(
          'exports',
          'require',
          'module',
          '__filename',
          '__dirname',
          IMPORT_DEFAULT_NAME,
          code
        );
        const { exports, require, path: dirname } = mod;
        try {
          // Only bound when the caller opted in, so that output built with the interop
          // wrappers fails loudly if it ever calls the helper.
          Reflect.apply(wrapper, exports, [
            exports,
            require,
            mod,
            request,
            dirname,
            rest.importDefault ? importDefault : undefined,
          ]);
        } catch (error) {
          (error as Error).message += ` (eval: ${dirname})`;
          throw error;
        }
      }
      return mod.exports;
    }

    // Kept in 1:1 compatibility with `metroImportDefault` in `metro-runtime`'s `require`
    // polyfill, including its per-module caching. The cache uses a sentinel rather than
    // `undefined`, which is itself a resolvable default export.
    function importDefault(target: string): unknown {
      const mod = modules[resolve(target)];
      if (mod != null && mod.importedDefault !== EMPTY) {
        return mod.importedDefault;
      }
      const exports = require(target) as Record<string, unknown> | null | undefined;
      return (modules[resolve(target)].importedDefault =
        exports && exports.__esModule ? exports.default : exports);
    }

    const exports = require('entry') as any;
    const requests = Object.keys(modules).filter((x) => x !== 'entry');
    return { requests, exports };
  };
};
