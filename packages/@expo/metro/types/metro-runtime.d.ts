// #region /modules/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/HMRClient.js
declare module '@expo/metro/metro-runtime/modules/HMRClient' {
  import { EventEmitter } from '@expo/metro/metro-runtime/modules/vendor/eventemitter3';

  export default class HMRClient extends EventEmitter {
    constructor(url: string);
    close(): void;
    send(message: string): void;
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    hasPendingUpdates(): boolean;
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/asyncRequire.js
declare module '@expo/metro/metro-runtime/modules/asyncRequire' {
  type DependencyMapPaths = Readonly<{ [moduleId: number | string]: unknown }> | null | undefined;

  interface asyncRequire {
    (moduleId: number, paths: DependencyMapPaths, moduleName?: string): Promise<any>;
    prefetch(moduleId: number, paths: DependencyMapPaths, moduleName?: string): void;
  }

  export default asyncRequire;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/empty-module.js
declare module '@expo/metro/metro-runtime/modules/empty-module' {
  // NOTE(cedric): this is literally an empty module
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/null-module.js
declare module '@expo/metro/metro-runtime/modules/null-module' {
  const nullModule: null;
  export default nullModule;
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/types.flow.js
declare module '@expo/metro/metro-runtime/modules/types' {
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

// #region /modules/vendor/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/modules/vendor/eventemitter3.js
declare module '@expo/metro/metro-runtime/modules/vendor/eventemitter3' {
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
    eventNames(): Array<EventNames<EventTypes>>;

    /** Return the listeners registered for a given event. */
    listeners<T extends EventNames<EventTypes>>(event: T): Array<EventListener<EventTypes, T>>;

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

  type EventEmitterInstance = InstanceType<typeof EventEmitter>;
  export default EventEmitterInstance;
}

// #region /polyfills/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-runtime/src/polyfills/require.js
declare module '@expo/metro/metro-runtime/polyfills/require' {
  type Exports = any;
  type ModuleID = number;
  type VerboseModuleNameForDev = string;

  export type RequireFn = (moduleId: ModuleID | VerboseModuleNameForDev) => Exports;

  type ArrayIndexable<T> = {
    readonly [index: number]: T;
  };

  type DependencyMap = Readonly<
    ArrayIndexable<ModuleID> & {
      paths?: { [id: ModuleID]: string };
    }
  >;

  type InverseDependencyMap = {
    [key: ModuleID]: ModuleID[];
  };

  type FactoryFn = (
    global: object,
    require: RequireFn,
    metroImportDefault: RequireFn,
    metroImportAll: RequireFn,
    moduleObject: { exports: Record<string, any> },
    exports: Record<string, any>,
    dependencyMap?: DependencyMap | null // ?DependencyMap
  ) => void;

  export type DefineFn = (
    factory: FactoryFn,
    moduleId: number,
    dependencyMap?: DependencyMap,
    verboseName?: string,
    inverseDependencies?: InverseDependencyMap
  ) => void;

  // TODO(cedric): add global extensions
  // declare var __DEV__: boolean;
  // declare var __METRO_GLOBAL_PREFIX__: string;
  // global.__r = (metroRequire: RequireFn);
  // global[`${__METRO_GLOBAL_PREFIX__}__d`] = (define: DefineFn);
  // global.__c = clear;
  // global.__registerSegment = registerSegment;
}
