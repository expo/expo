/**
 * @flow
 */
import { NativeModulesProxy } from 'expo-core';
import APPS from './utils/apps';
import INTERNALS from './utils/internals';
import type App from './app';
import { FirebaseNamespaces } from './constants';
import type { FirebaseOptions } from './types';

// TODO: Evan: Read Firebase version.
const VERSION = '4.3.8';

const { ExpoFirebaseApp } = NativeModulesProxy;

class Firebase {
  constructor() {
    if (!ExpoFirebaseApp) {
      throw new Error(INTERNALS.STRINGS.ERROR_MISSING_CORE);
    }
    APPS.initializeNativeApps();

    Object.keys(FirebaseNamespaces).map(namespace => {
      this[namespace] = function() {
        throw new Error(INTERNALS.STRINGS.ERROR_MISSING_IMPORT(namespace));
      };
    });
  }

  /**
   * Web SDK initializeApp
   *
   * @param options
   * @param name
   * @return {*}
   */
  initializeApp(options: FirebaseOptions, name: string): App {
    return APPS.initializeApp(options, name);
  }

  /**
   * Retrieves a Firebase app instance.
   *
   * When called with no arguments, the default app is returned.
   * When an app name is provided, the app corresponding to that name is returned.
   *
   * @param name
   * @return {*}
   */
  app(name?: string): App {
    return APPS.app(name);
  }

  /**
   * A (read-only) array of all initialized apps.
   * @return {Array}
   */
  get apps(): Array<App> {
    return APPS.apps();
  }

  /**
   * The current SDK version.
   * @return {string}
   */
  get SDK_VERSION(): string {
    return VERSION;
  }
}

export default new Firebase();
