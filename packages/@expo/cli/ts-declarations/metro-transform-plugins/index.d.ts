// #region metro-transform-plugins
declare module 'metro-transform-plugins' {
  export * from 'metro-transform-plugins/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/addParamsToDefineCall.js
declare module 'metro-transform-plugins/private/addParamsToDefineCall' {
  /**
   * Simple way of adding additional parameters to the end of the define calls.
   *
   * This is used to add extra information to the generaic compiled modules (like
   * the dependencyMap object or the list of inverse dependencies).
   */
  function addParamsToDefineCall(code: string, ...paramsToAdd: any[]): string;
  export default addParamsToDefineCall;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/constant-folding-plugin.js
declare module 'metro-transform-plugins/private/constant-folding-plugin' {
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

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/import-export-plugin.js
declare module 'metro-transform-plugins/private/import-export-plugin' {
  import type { PluginObj } from '@babel/core';
  import type { Node, Statement, SourceLocation } from '@babel/types';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_1$$;
  export type Options = Readonly<{
    importDefault: string;
    importAll: string;
    resolve: boolean;
    out?: {
      isESModule: boolean;
    };
  }>;
  type State = {
    exportAll: {
      file: string;
      loc?: null | SourceLocation;
    }[];
    exportDefault: {
      local: string;
      loc?: null | SourceLocation;
    }[];
    exportNamed: {
      local: string;
      remote: string;
      loc?: null | SourceLocation;
    }[];
    imports: {
      node: Statement;
    }[];
    importDefault: Node;
    importAll: Node;
    opts: Options;
  };
  function importExportPlugin($$PARAM_0$$: { types: Types }): PluginObj<State>;
  export default importExportPlugin;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/index.js
declare module 'metro-transform-plugins/private/index' {
  // See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/index.js

  // NOTE(cedric): this is quite a complicated CJS export, this can't be automatically typed

  export type { Options as ImportExportPluginOptions } from 'metro-transform-plugins/private/import-export-plugin';
  export type { Options as InlinePluginOptions } from 'metro-transform-plugins/private/inline-plugin';
  export type { PluginOptions as InlineRequiresPluginOptions } from 'metro-transform-plugins/private/inline-requires-plugin';
  export { default as addParamsToDefineCall } from 'metro-transform-plugins/private/addParamsToDefineCall';
  export { default as constantFoldingPlugin } from 'metro-transform-plugins/private/constant-folding-plugin';
  export { default as importExportPlugin } from 'metro-transform-plugins/private/import-export-plugin';
  export { default as inlinePlugin } from 'metro-transform-plugins/private/inline-plugin';
  export { default as inlineRequiresPlugin } from 'metro-transform-plugins/private/inline-requires-plugin';
  export { default as normalizePseudoGlobals } from 'metro-transform-plugins/private/normalizePseudoGlobals';
  export function getTransformPluginCacheKeyFiles(): string[];
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/inline-plugin.js
declare module 'metro-transform-plugins/private/inline-plugin' {
  import type { PluginObj } from '@babel/core';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/types';
  type Types = typeof $$IMPORT_TYPEOF_1$$;
  export type Options = Readonly<{
    dev: boolean;
    inlinePlatform: boolean;
    isWrapped: boolean;
    requireName?: string;
    platform: string;
  }>;
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

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/inline-requires-plugin.js
declare module 'metro-transform-plugins/private/inline-requires-plugin' {
  import type { PluginObj } from '@babel/core';
  import type * as $$IMPORT_TYPEOF_1$$ from '@babel/core';
  type Babel = typeof $$IMPORT_TYPEOF_1$$;
  export type PluginOptions = Readonly<{
    ignoredRequires?: readonly string[];
    inlineableCalls?: readonly string[];
    nonMemoizedModules?: readonly string[];
    memoizeCalls?: boolean;
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

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/normalizePseudoGlobals.js
declare module 'metro-transform-plugins/private/normalizePseudoGlobals' {
  import type { Node } from '@babel/types';
  export type Options = {
    reservedNames: readonly string[];
  };
  function normalizePseudoglobals(ast: Node, options?: Options): readonly string[];
  export default normalizePseudoglobals;
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-transform-plugins/src/utils/createInlinePlatformChecks.js
declare module 'metro-transform-plugins/private/utils/createInlinePlatformChecks' {
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
