/**
 * @flow
 */
import { initialiseLogger, getLogger } from './log';
import { initialiseNativeModule, getNativeModule } from './native';

import firebase from '../index';

import type App from '../app';
import type { FirebaseModuleConfig, FirebaseNamespace } from '../types';

export default class ModuleBase {
  _app: App;

  _customUrlOrRegion: ?string;

  namespace: FirebaseNamespace;

  /**
   *
   * @param app
   * @param config
   */
  constructor(app: App, config: FirebaseModuleConfig, customUrlOrRegion: ?string) {
    if (!config.moduleName) {
      throw new Error('Missing module name');
    }
    if (!config.namespace) {
      throw new Error('Missing namespace');
    }
    const { moduleName } = config;
    this._app = app;
    this._customUrlOrRegion = customUrlOrRegion;
    this.namespace = config.namespace;

    // check if native module exists as all native
    initialiseNativeModule(this, config, customUrlOrRegion);
    initialiseLogger(this, `${app.name}:${moduleName.replace('ExpoFirebase', '')}`);
  }

  /**
   * Returns the App instance for current module
   * @return {*}
   */
  get app(): App {
    return this._app;
  }

  get nativeModule() {
    return getNativeModule(this);
  }

  get logger() {
    return getLogger(this);
  }
}
