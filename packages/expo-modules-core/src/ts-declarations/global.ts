import type { EventEmitter } from './EventEmitter';
import type { NativeModule } from './NativeModule';
import type { SharedObject } from './SharedObject';
import type { SharedRef } from './SharedRef';

export interface ExpoGlobal {
  /**
   * Host object that is used to access native Expo modules.
   */
  modules: Record<string, any>;

  // Natively defined JS classes

  /**
   * @see EventEmitter
   */
  EventEmitter: typeof EventEmitter;

  /**
   * @see SharedObject
   */
  SharedObject: typeof SharedObject;

  /**
   * @see SharedRef
   */
  SharedRef: typeof SharedRef;

  /**
   * @see NativeModule
   */
  NativeModule: typeof NativeModule;

  // Utils

  /**
   * Generates a random UUID v4 string.
   */
  uuidv4(): string;

  /**
   * Generates a UUID v5 string representation of the value in the specified namespace.
   */
  uuidv5(name: string, namespace: string): string;

  /**
   * Returns a static view config of the native view with the given name
   * or `null` if the view has not been registered.
   */
  getViewConfig(viewName: string): ViewConfig | null;

  /**
   * Reloads the app.
   */
  reloadAppAsync(reason: string): Promise<void>;
}

type ViewConfig = {
  validAttributes: Record<string, any>;
  directEventTypes: Record<string, { registrationName: string }>;
};

export interface ExpoProcess {
  env: {
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
  };
  [key: string]: any;
}

/* eslint-disable no-var */

declare global {
  /**
   * Global object containing all the native bindings installed by Expo.
   * This object is not available in projects without the `expo` package installed.
   */
  var expo: ExpoGlobal;

  // @ts-ignore - Suppress incompatible `NodeJS.Process` type if people include process type from `@types/node`
  var process: ExpoProcess;

  /**
   * ExpoDomWebView is defined in `@expo/dom-webview` runtime.
   */
  var ExpoDomWebView: Record<string, any> | undefined;
}
