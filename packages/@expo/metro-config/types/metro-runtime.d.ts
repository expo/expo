// #region modules/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/types.flow.js
declare module '@expo/metro-config/metro-runtime/modules/types.flow' {
  export type ModuleMap = readonly [number, string][];

  export type Bundle = {
    modules: ModuleMap;
    post: string;
    pre: string;
  };

  export type DeltaBundle = {
    added: ModuleMap;
    modified: ModuleMap;
    deleted: readonly number[];
  };

  export type BundleVariant =
    | ({ base: true; revisionId: string } & Bundle)
    | ({ base: false; revisionId: string } & DeltaBundle);

  export type BundleMetadata = {
    pre: number;
    post: number;
    modules: readonly [number, number][];
  };

  export type FormattedError = {
    type: string;
    message: string;
    errors: {
      description: string;
      [key: string]: any; // ...
    }[];
  };

  export type HmrModule = {
    module: [number, string];
    sourceMappingURL: string;
    sourceURL: string;
  };

  export type HmrUpdate = {
    added: readonly HmrModule[];
    deleted: readonly number[];
    isInitialUpdate: boolean;
    modified: readonly HmrModule[];
    revisionId: string;
  };

  export type HmrUpdateMessage = {
    type: 'update';
    body: HmrUpdate;
  };

  export type HmrErrorMessage = {
    type: 'error';
    body: FormattedError;
  };

  export type HmrClientMessage =
    | { type: 'log-opt-in' }
    | { type: 'register-entrypoints'; entryPoints: string[] }
    | {
        type: 'log';
        data: any[];
        mode: 'BRIDGE' | 'NOBRIDGE';
        level:
          | 'trace'
          | 'info'
          | 'warn'
          | 'log'
          | 'group'
          | 'groupCollapsed'
          | 'groupEnd'
          | 'debug';
      };

  export type HmrMessage =
    | { type: 'bundle-registered' }
    | { type: 'update-start'; body: { isInitialUpdate: boolean } }
    | { type: 'update-done' }
    | HmrUpdateMessage
    | HmrErrorMessage;
}
