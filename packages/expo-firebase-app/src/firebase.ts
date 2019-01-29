/**
 * @flow
 */
import { NativeModulesProxy } from 'expo-core';
import invariant from 'invariant';
import APPS from './utils/apps';
import INTERNALS from './utils/internals';
import type App from './app';
import { FirebaseNamespaces } from './constants';
import type { FirebaseOptions } from './types';

import getModuleInstance from './utils/getModuleInstance';

// TODO: Evan: Read Firebase version.
const VERSION = '5.0.0';

const { ExpoFirebaseApp } = NativeModulesProxy;

function createDefaultModule(instance, namespace) {
  return function() {
    invariant(
      namespace in FirebaseNamespaces,
      `FirebaseApp: Internal: ${namespace} is not a valid namespace.`
    );
    const InstanceType = getModuleInstance(namespace);
    const module = APPS.moduleAndStatics(namespace, InstanceType.statics, InstanceType.MODULE_NAME);
    instance[namespace] = module;
    return module();
  };
}

class Firebase {
  constructor() {
    invariant(ExpoFirebaseApp, INTERNALS.STRINGS.ERROR_MISSING_CORE);

    APPS.initializeNativeApps();

    Object.keys(FirebaseNamespaces).map(namespace => {
      this[namespace] = createDefaultModule(this, namespace);
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
