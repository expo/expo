// #region metro-runtime
// metro-runtime has no entrypoint

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/asyncRequire.js
declare module 'metro-runtime/src/modules/asyncRequire' {
  type DependencyMapPaths =
    | null
    | undefined
    | Readonly<{
        [moduleID: number | string]: any;
      }>;
  function asyncRequire<T>(
    moduleID: number,
    paths: DependencyMapPaths,
    moduleName?: string
  ): Promise<T>;
  export default asyncRequire;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/empty-module.js
declare module 'metro-runtime/src/modules/empty-module' {
  // This has no exports
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/HMRClient.js
declare module 'metro-runtime/src/modules/HMRClient' {
  import type { HmrUpdate } from 'metro-runtime/src/modules/types.flow';
  import EventEmitter from 'metro-runtime/src/modules/vendor/eventemitter3';
  type SocketState = 'opening' | 'open' | 'closed';
  class HMRClient extends EventEmitter {
    _isEnabled: boolean;
    _pendingUpdate: HmrUpdate | null;
    _queue: string[];
    _state: SocketState;
    _ws: WebSocket;
    constructor(url: string);
    close(): void;
    send(message: string): void;
    _flushQueue(): void;
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    hasPendingUpdates(): boolean;
  }
  export default HMRClient;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/null-module.js
declare module 'metro-runtime/src/modules/null-module' {
  const $$EXPORT_DEFAULT_DECLARATION$$: null;
  export default $$EXPORT_DEFAULT_DECLARATION$$;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/types.flow.js
declare module 'metro-runtime/src/modules/types.flow' {
  export type ModuleMap = readonly [number, string][];
  export type Bundle = {
    readonly modules: ModuleMap;
    readonly post: string;
    readonly pre: string;
  };
  export type DeltaBundle = {
    readonly added: ModuleMap;
    readonly modified: ModuleMap;
    readonly deleted: readonly number[];
  };
  export type BundleVariant =
    | ({
        readonly base: true;
        readonly revisionId: string;
      } & Bundle)
    | ({
        readonly base: false;
        readonly revisionId: string;
      } & DeltaBundle);
  export type BundleMetadata = {
    readonly pre: number;
    readonly post: number;
    readonly modules: readonly [number, number][];
  };
  export type FormattedError = {
    readonly type: string;
    readonly message: string;
    readonly errors: {
      description: string;
    }[];
  };
  export type HmrModule = {
    readonly module: [number, string];
    readonly sourceMappingURL: string;
    readonly sourceURL: string;
  };
  export type HmrUpdate = {
    readonly added: readonly HmrModule[];
    readonly deleted: readonly number[];
    readonly isInitialUpdate: boolean;
    readonly modified: readonly HmrModule[];
    readonly revisionId: string;
  };
  export type HmrUpdateMessage = {
    readonly type: 'update';
    readonly body: HmrUpdate;
  };
  export type HmrErrorMessage = {
    readonly type: 'error';
    readonly body: FormattedError;
  };
  export type HmrClientMessage =
    | {
        readonly type: 'register-entrypoints';
        readonly entryPoints: string[];
      }
    | {
        readonly type: 'log';
        readonly level?:
          | 'trace'
          | 'info'
          | 'warn'
          | 'log'
          | 'group'
          | 'groupCollapsed'
          | 'groupEnd'
          | 'debug';
        readonly data: any[];
        readonly mode?: 'BRIDGE' | 'NOBRIDGE';
      }
    | {
        readonly type: 'log-opt-in';
      };
  export type HmrMessage =
    | {
        readonly type: 'bundle-registered';
      }
    | {
        readonly type: 'update-start';
        readonly body: {
          readonly isInitialUpdate: boolean;
        };
      }
    | {
        readonly type: 'update-done';
      }
    | HmrUpdateMessage
    | HmrErrorMessage;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/modules/vendor/eventemitter3.js
declare module 'metro-runtime/src/modules/vendor/eventemitter3' {
  /**
   * `object` should be in either of the following forms:
   * ```
   * interface EventTypes {
   *   'event-with-parameters': any[]
   *   'event-with-example-handler': (...args: any[]) => void
   * }
   * ```
   */
  export type ValidEventTypes = string | symbol | object;
  export type EventNames<T extends ValidEventTypes> = T extends string | symbol ? T : keyof T;
  export type ArgumentMap<T extends object> = {
    [K in keyof T]: T[K] extends (...args: any[]) => void
      ? Parameters<T[K]>
      : T[K] extends any[]
        ? T[K]
        : any[];
  };
  export type EventListener<T extends ValidEventTypes, K extends EventNames<T>> = T extends
    | string
    | symbol
    ? (...args: any[]) => void
    : (...args: ArgumentMap<Exclude<T, string | symbol>>[Extract<K, keyof T>]) => void;
  export type EventArgs<T extends ValidEventTypes, K extends EventNames<T>> = Parameters<
    EventListener<T, K>
  >;
  export class EventEmitter<
    EventTypes extends ValidEventTypes = string | symbol,
    Context extends any = any,
  > {
    static prefixed: string | boolean;

    /** Return an array listing the events for which the emitter has registered listeners. */
    eventNames(): EventNames<EventTypes>[];

    /** Return the listeners registered for a given event. */
    listeners<T extends EventNames<EventTypes>>(event: T): EventListener<EventTypes, T>[];

    /** Return the number of listeners listening to a given event. */
    listenerCount(event: EventNames<EventTypes>): number;

    /** Calls each of the listeners registered for a given event. */
    emit<T extends EventNames<EventTypes>>(event: T, ...args: EventArgs<EventTypes, T>): boolean;

    /** Add a listener for a given event. */
    on<T extends EventNames<EventTypes>>(
      event: T,
      fn: EventListener<EventTypes, T>,
      context?: Context
    ): this;
    addListener<T extends EventNames<EventTypes>>(
      event: T,
      fn: EventListener<EventTypes, T>,
      context?: Context
    ): this;

    /** Add a one-time listener for a given event. */
    once<T extends EventNames<EventTypes>>(
      event: T,
      fn: EventListener<EventTypes, T>,
      context?: Context
    ): this;

    /** Remove the listeners of a given event. */
    removeListener<T extends EventNames<EventTypes>>(
      event: T,
      fn?: EventListener<EventTypes, T>,
      context?: Context,
      once?: boolean
    ): this;
    off<T extends EventNames<EventTypes>>(
      event: T,
      fn?: EventListener<EventTypes, T>,
      context?: Context,
      once?: boolean
    ): this;

    /** Remove all listeners, or those of the specified event. */
    removeAllListeners(event?: EventNames<EventTypes>): this;
  }
  export default EventEmitter;
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-runtime/src/polyfills/require.js
declare module 'metro-runtime/src/polyfills/require' {
  type ArrayIndexable<T> = {
    readonly [indexer: number]: T;
  };
  type DependencyMap = Readonly<
    ArrayIndexable<ModuleID> & {
      paths?: {
        [id: ModuleID]: string;
      };
    }
  >;
  type InverseDependencyMap = {
    [key: ModuleID]: ModuleID[];
  };
  type Exports = any;
  type FactoryFn = (
    global: object,
    require: RequireFn,
    metroImportDefault: RequireFn,
    metroImportAll: RequireFn,
    moduleObject: {
      exports: object;
    },
    exports: object,
    dependencyMap: null | undefined | DependencyMap
  ) => void;
  type ModuleID = number;
  export type RequireFn = (id: ModuleID | VerboseModuleNameForDev) => Exports;
  export type DefineFn = (
    factory: FactoryFn,
    moduleId: number,
    dependencyMap?: DependencyMap,
    verboseName?: string,
    inverseDependencies?: InverseDependencyMap
  ) => void;
  type VerboseModuleNameForDev = string;
}
