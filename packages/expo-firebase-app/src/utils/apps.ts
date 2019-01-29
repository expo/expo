/**
 * @flow
 */
import { NativeModulesProxy } from 'expo-core';

import invariant from 'invariant';
import App from '../app';
import { DEFAULT_APP_NAME } from '../constants';
import { isObject, isString } from './';
import { APP_STORE, CUSTOM_URL_OR_REGION_NAMESPACES } from './appStore';
import INTERNALS from './internals';
import parseConfig from './parseConfig';
import type {
  FirebaseModule,
  FirebaseModuleAndStatics,
  FirebaseModuleName,
  FirebaseNamespace,
  FirebaseOptions,
  FirebaseStatics,
} from '../types';

const { ExpoFirebaseApp: FirebaseCoreModule } = NativeModulesProxy;

export default {
  app(name?: string): App {
    const _name = name ? name.toUpperCase() : DEFAULT_APP_NAME;
    const app = APP_STORE[_name];
    invariant(app, INTERNALS.STRINGS.ERROR_APP_NOT_INIT(_name));
    return app;
  },

  apps(): Array<App> {
    // $FlowExpectedError: Object.values always returns mixed type: https://github.com/facebook/flow/issues/2221
    return Object.values(APP_STORE);
  },

  deleteApp(name: string): Promise<boolean> {
    const app = APP_STORE[name];
    if (!app) return Promise.resolve(true);

    // https://firebase.google.com/docs/reference/js/firebase.app.App#delete
    return app.delete().then(() => {
      delete APP_STORE[name];
      return true;
    });
  },

  /**
   * Web SDK initializeApp
   *
   * @param options
   * @param name
   * @return {*}
   */
  initializeApp(options: FirebaseOptions, name: string): App {
    invariant(!name || isString(name), INTERNALS.STRINGS.ERROR_INIT_STRING_NAME);

    const _name = (name || DEFAULT_APP_NAME).toUpperCase();

    const isDefault = _name === DEFAULT_APP_NAME;
    // return an existing app if found
    if (APP_STORE[_name] && !isDefault) {
      return APP_STORE[_name];
    }

    // only validate if app doesn't already exist
    // to allow apps already initialized natively
    // to still go through init without erroring (backwards compatibility)
    invariant(isObject(options), INTERNALS.STRINGS.ERROR_INIT_OBJECT);

    options = parseConfig(options);

    ['apiKey', 'appId', 'databaseURL', 'messagingSenderId', 'projectId', 'storageBucket'].forEach(
      prop => {
        invariant(options[prop], INTERNALS.STRINGS.ERROR_MISSING_OPT(prop));
      }
    );

    APP_STORE[_name] = new App(_name, options);

    return APP_STORE[_name];
  },

  /**
   * Bootstraps all native app instances that were discovered on boot
   */
  initializeNativeApps() {
    for (let i = 0, len = FirebaseCoreModule.apps.length; i < len; i++) {
      const app = FirebaseCoreModule.apps[i];
      const options = Object.assign({}, app);
      delete options.name;
      APP_STORE[app.name] = new App(app.name, options, true);
    }
  },
  /**
   *
   * @param namespace
   * @param statics
   * @param moduleName
   * @return {function(App=)}
   */
  moduleAndStatics<M: FirebaseModule, S: FirebaseStatics>(
    namespace: FirebaseNamespace,
    statics: S,
    moduleName: FirebaseModuleName
  ): FirebaseModuleAndStatics<M, S> {
    const getModule = (
      appOrUrlOrRegion?: App | string,
      customUrlOrRegion?: string
    ): FirebaseModule => {
      let _app = appOrUrlOrRegion;
      let _customUrlOrRegion: ?string = customUrlOrRegion || null;

      if (typeof appOrUrlOrRegion === 'string' && CUSTOM_URL_OR_REGION_NAMESPACES[namespace]) {
        _app = null;
        _customUrlOrRegion = appOrUrlOrRegion;
      }

      // throw an error if it's not a valid app instance
      if (_app) {
        invariant(_app instanceof App, INTERNALS.STRINGS.ERROR_NOT_APP(namespace));
      } else {
        // default to the 'DEFAULT' app if no arg provided - will throw an error
        // if default app not initialized
        _app = this.app(DEFAULT_APP_NAME);
      }

      // $FlowExpectedError: Flow doesn't support indexable signatures on classes: https://github.com/facebook/flow/issues/1323
      const module = _app[namespace];
      return module(_customUrlOrRegion);
    };

    return Object.assign(getModule, statics, {
      nativeModuleExists: !!NativeModulesProxy[moduleName],
    });
  },
};
