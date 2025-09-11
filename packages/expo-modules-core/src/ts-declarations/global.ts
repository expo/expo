import { EventEmitter } from './EventEmitter';
import { NativeModule } from './NativeModule';
import { SharedObject } from './SharedObject';
import { SharedRef } from './SharedRef';

type ViewConfig = {
  validAttributes: Record<string, any>;
  directEventTypes: Record<string, { registrationName: string }>;
};

export interface ExpoProcessEnv {
  NODE_ENV: string;
  /** Used in `@expo/metro-runtime`. */
  EXPO_DEV_SERVER_ORIGIN?: string;

  EXPO_ROUTER_IMPORT_MODE?: string;
  EXPO_ROUTER_ABS_APP_ROOT?: string;
  EXPO_ROUTER_APP_ROOT?: string;

  /** Maps to the `experiments.baseUrl` property in the project Expo config. This is injected by `babel-preset-expo` and supports automatic cache invalidation. */
  EXPO_BASE_URL?: string;

  /** Build-time representation of the `Platform.OS` value that the current JavaScript was bundled for. Does not support platform shaking wrapped require statements. */
  EXPO_OS?: string;

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

  // Natively defined JS classes
  export { EventEmitter };
  export { SharedObject };
  export { SharedRef };
  export { NativeModule };

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
