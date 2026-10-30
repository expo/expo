import type { EventEmitter as EventEmitterClass, EventsMap } from './EventEmitter';
import type { NativeModule as NativeModuleClass } from './NativeModule';
import type { SharedObject as SharedObjectClass } from './SharedObject';
import type { SharedRef as SharedRefClass } from './SharedRef';

type ViewConfig = {
  validAttributes: Record<string, any>;
  directEventTypes: Record<string, { registrationName: string }>;
};

export interface ExpoProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  /** Used in `@expo/metro-runtime`. */
  EXPO_DEV_SERVER_ORIGIN?: string;

  EXPO_ROUTER_IMPORT_MODE?: string;
  EXPO_ROUTER_APP_ROOT?: string;

  /** Maps to the `experiments.baseUrl` property in the project Expo config. This is injected by `babel-preset-expo` and supports automatic cache invalidation. */
  EXPO_BASE_URL?: string;

  /** Build-time representation of the `Platform.OS` value that the current JavaScript was bundled for. Does not support platform shaking wrapped require statements. */
  EXPO_OS?: string;

  /** Run-time representation of the `Platform.OS` for the top-most platform that's hosting the DOM component. Only defined in DOM components, undefined in standard runtimes and on web. */
  EXPO_DOM_HOST_OS?: 'ios' | 'android' | (string & {});

  [key: string]: any;
}

export interface ExpoProcess {
  env: ExpoProcessEnv;
  [key: string]: any;
}

/**
 * Global object containing all the native bindings installed by Expo.
 * This object is not available in projects without the `expo` package installed.
 */
declare namespace ExpoGlobal {
  /** Host object that is used to access native Expo modules. */
  export let modules: Record<string, any>;

  // Natively defined JS classes. Keep the imports type-only: their modules export no values, so a
  // value import stays in the emitted JavaScript and esbuild fails with "No matching export".
  export const EventEmitter: typeof EventEmitterClass;
  export type EventEmitter<TEventsMap extends EventsMap = Record<never, never>> =
    EventEmitterClass<TEventsMap>;
  export const SharedObject: typeof SharedObjectClass;
  export type SharedObject<TEventsMap extends EventsMap = Record<never, never>> =
    SharedObjectClass<TEventsMap>;
  export const SharedRef: typeof SharedRefClass;
  export type SharedRef<
    TNativeRefType extends string = 'unknown',
    TEventsMap extends EventsMap = Record<never, never>,
  > = SharedRefClass<TNativeRefType, TEventsMap>;
  export const NativeModule: typeof NativeModuleClass;
  export type NativeModule<TEventsMap extends EventsMap = Record<never, never>> =
    NativeModuleClass<TEventsMap>;

  // Properties

  /**
   * The version of the `expo-modules-core` package.
   * @platform android
   * @platform ios
   */
  export const expoModulesCoreVersion:
    | undefined
    | {
        version: string;
        major: number;
        minor: number;
        patch: number;
      };

  /**
   * The path to the cache directory
   * @platform android
   * @platform ios
   */
  export const cacheDir: undefined | string;

  /**
   * The path to the documents directory
   * @platform android
   * @platform ios
   */
  export const documentsDir: undefined | string;

  /**
   * Whether the app is running on a Meta Quest device. Always `false` on iOS and web.
   */
  export const isRunningOnQuest: boolean;

  // Utils

  /**
   * Generates a random UUID v4 string.
   */
  export function uuidv4(): string;

  /**
   * Generates a UUID v5 string representation of the value in the specified namespace.
   */
  export function uuidv5(name: string, namespace: string): string;

  /**
   * Returns a static view config of the native view with the given name
   * or `null` if the view has not been registered.
   */
  export function getViewConfig(moduleName: string, viewName?: string): ViewConfig | null;

  /**
   * Reloads the app.
   */
  export function reloadAppAsync(reason: string): Promise<void>;

  /**
   * Installs Expo Modules inside the worklets UI runtime.
   * @param uiRuntimeHolder The UI runtime holder from `getUIRuntimeHolder()` in
   * `react-native-worklets`.
   */
  export function installOnUIRuntime(uiRuntimeHolder: object): void;
}

/* eslint-disable no-var */
declare global {
  namespace NodeJS {
    export interface ProcessEnv extends ExpoProcessEnv {}
    export interface Process extends ExpoProcess {
      env: ProcessEnv;
    }
  }

  var expo: typeof ExpoGlobal;
  var process: NodeJS.Process;

  /**
   * ExpoDomWebView is defined in `@expo/dom-webview` runtime.
   */
  var ExpoDomWebView: ExpoDomWebView;
}

export type ExpoDomWebView = Record<string, unknown>;
export type { ExpoGlobal };
