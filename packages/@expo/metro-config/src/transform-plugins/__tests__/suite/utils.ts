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

export const makeEval = ({
  plugins = [importExportLiveBindingsPlugin],
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

    function transform(code: string): string {
      return generate(transformToAst(plugins, code, rest)).code;
    }

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
          code
        );
        const { exports, require, path: dirname } = mod;
        Reflect.apply(wrapper, exports, [exports, require, mod, request, dirname]);
        mod.loaded = true;
      }
      return mod.exports;
    }

    const exports = require('entry') as any;
    const requests = Object.keys(modules).filter((x) => x !== 'entry');
    return { requests, exports };
  };
};
