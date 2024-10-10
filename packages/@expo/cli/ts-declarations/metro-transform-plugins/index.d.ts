// #region metro-transform-plugins
declare module 'metro-transform-plugins' {
  export * from 'metro-transform-plugins/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/addParamsToDefineCall.js
declare module 'metro-transform-plugins/src/addParamsToDefineCall' {
  /**
   * Simple way of adding additional parameters to the end of the define calls.
   *
   * This is used to add extra information to the generaic compiled modules (like
   * the dependencyMap object or the list of inverse dependencies).
   */
  function addParamsToDefineCall(code: string, ...paramsToAdd: any[]): string;
  export default addParamsToDefineCall;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/constant-folding-plugin.js
declare module 'metro-transform-plugins/src/constant-folding-plugin' {
  import type { PluginObj } from '@babel/core';
  import type $$IMPORT_TYPEOF_1$$ from '@babel/traverse';
  type Traverse = typeof $$IMPORT_TYPEOF_1$$;
  import type * as $$IMPORT_TYPEOF_2$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_2$$;
  type State = {
    stripped: boolean;
  };
  function constantFoldingPlugin(context: { types: Types; traverse: Traverse }): PluginObj<State>;
  export default constantFoldingPlugin;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/import-export-plugin.js
declare module 'metro-transform-plugins/src/import-export-plugin' {
  import type * as _babel_types from '@babel/types';
  import type { PluginObj } from '@babel/core';
  import type { Statement } from '@babel/types';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_1$$;
  type State = {
    exportAll: {
      file: string;
      loc?: null | _babel_types.SourceLocation;
    }[];
    exportDefault: {
      local: string;
      loc?: null | _babel_types.SourceLocation;
    }[];
    exportNamed: {
      local: string;
      remote: string;
      loc?: null | _babel_types.SourceLocation;
    }[];
    imports: {
      node: Statement;
    }[];
    importDefault: _babel_types.Node;
    importAll: _babel_types.Node;
    opts: {
      importDefault: string;
      importAll: string;
      resolve: boolean;
      out?: {
        isESModule: boolean;
      };
    };
  };
  function importExportPlugin($$PARAM_0$$: { types: Types }): PluginObj<State>;
  export default importExportPlugin;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/index.js
declare module 'metro-transform-plugins/src/index' {
  // See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/index.js

  // NOTE(cedric): this is quite a complicated CJS export, this can't be automatically typed

  export type { Options as InlinePluginOptions } from 'metro-transform-plugins/src/inline-plugin';
  export { default as addParamsToDefineCall } from 'metro-transform-plugins/src/addParamsToDefineCall';
  export { default as constantFoldingPlugin } from 'metro-transform-plugins/src/constant-folding-plugin';
  export { default as importExportPlugin } from 'metro-transform-plugins/src/import-export-plugin';
  export { default as inlinePlugin } from 'metro-transform-plugins/src/inline-plugin';
  export { default as inlineRequiresPlugin } from 'metro-transform-plugins/src/inline-requires-plugin';
  export { default as normalizePseudoGlobals } from 'metro-transform-plugins/src/normalizePseudoGlobals';
  export function getTransformPluginCacheKeyFiles(): string[];
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/inline-plugin.js
declare module 'metro-transform-plugins/src/inline-plugin' {
  import type { PluginObj } from '@babel/core';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_1$$;
  export type Options = {
    dev: boolean;
    inlinePlatform: boolean;
    isWrapped: boolean;
    requireName?: string;
    platform: string;
  };
  type State = {
    opts: Options;
  };
  function inlinePlugin(
    $$PARAM_0$$: {
      types: Types;
    },
    options: Options
  ): PluginObj<State>;
  export default inlinePlugin;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/inline-requires-plugin.js
declare module 'metro-transform-plugins/src/inline-requires-plugin' {
  import type { PluginObj } from '@babel/core';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/core';
  type Babel = typeof $$IMPORT_TYPEOF_1$$;
  export type PluginOptions = Readonly<{
    ignoredRequires?: readonly string[];
    inlineableCalls?: readonly string[];
  }>;
  export type State = {
    opts?: PluginOptions;
    ignoredRequires: Set<string>;
    inlineableCalls: Set<string>;
    membersAssigned: Map<string, Set<string>>;
  };
  const $$EXPORT_DEFAULT_DECLARATION$$: ($$PARAM_0$$: Babel) => PluginObj<State>;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/normalizePseudoGlobals.js
declare module 'metro-transform-plugins/src/normalizePseudoGlobals' {
  import type * as _babel_types from '@babel/types';
  export type Options = {
    reservedNames: readonly string[];
  };
  function normalizePseudoglobals(ast: _babel_types.Node, options?: Options): readonly string[];
  export default normalizePseudoglobals;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-transform-plugins/src/utils/createInlinePlatformChecks.js
declare module 'metro-transform-plugins/src/utils/createInlinePlatformChecks' {
  import type { Scope } from '@babel/traverse';
  import type { CallExpression, MemberExpression } from '@babel/types';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_1$$;
  type PlatformChecks = {
    isPlatformNode: (node: MemberExpression, scope: Scope, isWrappedModule: boolean) => boolean;
    isPlatformSelectNode: (node: CallExpression, scope: Scope, isWrappedModule: boolean) => boolean;
  };
  function createInlinePlatformChecks(t: Types, requireName?: string): PlatformChecks;
  export default createInlinePlatformChecks;
}
