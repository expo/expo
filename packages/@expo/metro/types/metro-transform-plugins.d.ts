// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/index.js (entry point)
declare module '@expo/metro/metro-transform-plugins' {
  import addParamsToDefineCall from '@expo/metro/metro-transform-plugins/addParamsToDefineCall';
  import ConstantFoldingPlugin from '@expo/metro/metro-transform-plugins/constant-folding-plugin';
  import ImportExportPlugin from '@expo/metro/metro-transform-plugins/import-export-plugin';
  import InlinePlugin from '@expo/metro/metro-transform-plugins/inline-plugin';
  import InlineRequiresPlugin from '@expo/metro/metro-transform-plugins/inline-requires-plugin';
  import NormalizePseudoGlobalsFn from '@expo/metro/metro-transform-plugins/normalizePseudoGlobals';

  export type { Options as InlinePluginOptions } from '@expo/metro/metro-transform-plugins/inline-plugin';

  type TransformPlugins = {
    addParamsToDefineCall: typeof addParamsToDefineCall;
    constantFoldingPlugin: typeof ConstantFoldingPlugin;
    importExportPlugin: typeof ImportExportPlugin;
    inlinePlugin: typeof InlinePlugin;
    inlineRequiresPlugin: typeof InlineRequiresPlugin;
    normalizePseudoGlobals: typeof NormalizePseudoGlobalsFn;
    getTransformPluginCacheKeyFiles(): readonly string[];
  };

  const transformPlugins: TransformPlugins;

  export default transformPlugins;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/addParamsToDefineCall.js
declare module '@expo/metro/metro-transform-plugins/addParamsToDefineCall' {
  /**
   * Simple way of adding additional parameters to the end of the define calls.
   *
   * This is used to add extra information to the generaic compiled modules (like
   * the dependencyMap object or the list of inverse dependencies).
   */
  export default function addParamsToDefineCall(code: string, ...paramsToAdd: any[]): string;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/constant-folding-plugin.js
declare module '@expo/metro/metro-transform-plugins/constant-folding-plugin' {
  import * as BabelCore from '@babel/core';

  type State = { stripped: boolean };

  export default function constantFoldingPlugin(
    babel: Pick<typeof BabelCore, 'types' | 'traverse'>
  ): BabelCore.PluginObj<State>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/import-export-plugin.js
declare module '@expo/metro/metro-transform-plugins/import-export-plugin' {
  import * as BabelCore from '@babel/core';

  type State = {
    exportAll: {
      file: string;
      loc?: BabelCore.types.SourceLocation | null; // ?BabelSourceLocation
      [key: string]: any; // ...
    }[];
    exportDefault: {
      local: string;
      loc?: BabelCore.types.SourceLocation | null; // ?BabelSourceLocation
      [key: string]: any; // ...
    }[];
    exportNamed: {
      local: string;
      remote: string;
      loc?: BabelCore.types.SourceLocation | null; // ?BabelSourceLocation
      [key: string]: any; // ...
    }[];
    imports: { node: BabelCore.types.Statement }[];
    importDefault: BabelCore.Node;
    importAll: BabelCore.Node;
    opts: {
      importDefault: string;
      importAll: string;
      resolve: boolean;
      out?: {
        isESModule: boolean;
        [key: string]: any; // ...
      };
      [key: string]: any; // ...
    };
    [key: string]: any; // ...
  };

  export default function importExportPlugin(
    babel: Pick<typeof BabelCore, 'types'>
  ): BabelCore.PluginObj<State>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/inline-plugin.js
declare module '@expo/metro/metro-transform-plugins/inline-plugin' {
  import * as BabelCore from '@babel/core';

  export type Options = {
    dev: boolean;
    inlinePlatform: boolean;
    isWrapped: boolean;
    requireName?: string;
    platform: string;
  };

  type State = { opts: Options };

  export default function inlinePlugin(
    babel: Pick<typeof BabelCore, 'types'>,
    options: Options
  ): BabelCore.PluginObj<State>;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/inline-requires-plugin.js
declare module '@expo/metro/metro-transform-plugins/inline-requires-plugin' {
  import * as BabelCore from '@babel/core';

  /**
   * This transform inlines top-level require(...) aliases with to enable lazy
   * loading of dependencies. It is able to inline both single references and
   * child property references.
   *
   * For instance:
   *     var Foo = require('foo');
   *     f(Foo);
   *
   * Will be transformed into:
   *     f(require('foo'));
   *
   * When the assigment expression has a property access, it will be inlined too,
   * keeping the property. For instance:
   *     var Bar = require('foo').bar;
   *     g(Bar);
   *
   * Will be transformed into:
   *     g(require('foo').bar);
   *
   * Destructuring also works the same way. For instance:
   *     const {Baz} = require('foo');
   *     h(Baz);
   *
   * Is also successfully inlined into:
   *     g(require('foo').Baz);
   */
  export default function inlineRequiresPlugin(
    babel: Pick<typeof BabelCore, 'types'>
  ): BabelCore.PluginObj;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/normalizePseudoGlobals.js
declare module '@expo/metro/metro-transform-plugins/normalizePseudoGlobals' {
  import type { Node as BabelNode } from '@babel/core';

  export type Options = { reservedNames: readonly string[] };

  export default function normalizePseudoGlobals(
    ast: BabelNode,
    options?: Options
  ): readonly string[];
}

// #region /utils/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-transform-plugins/src/utils/createInlinePlatformChecks.js
declare module '@expo/metro/metro-transform-plugins/utils/createInlinePlatformChecks' {
  import type { Scope } from '@babel/traverse';
  import * as BabelTypes from '@babel/types';

  type PlatformChecks = {
    isPlatformNode: (node: BabelTypes.MemberExpression, scope: Scope, isWrappedModule: boolean) => boolean;
    isPlatformSelectNode: (node: BabelTypes.CallExpression, scope: Scope, isWrappedModule: boolean) => boolean;
  };

  export default function createInlinePlatformChecks(
    types: typeof BabelTypes,
    requireName: string = 'require'
  ): PlatformChecks;
}
