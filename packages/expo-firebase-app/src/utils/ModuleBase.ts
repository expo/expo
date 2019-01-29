import invariant from 'invariant';
import { initialiseLogger, getLogger } from './log';
import { initialiseNativeModule, getNativeModule } from './native';
import App from '../app';
import { FirebaseModuleConfig, FirebaseNamespace } from '../types';

export default class ModuleBase {
  _app: App;

  _customUrlOrRegion?: string;

  namespace: FirebaseNamespace;

  /**
   *
   * @param app
   * @param config
   */
  constructor(app: App, config: FirebaseModuleConfig, customUrlOrRegion?: string) {
    invariant(config.moduleName, 'Error: expo-firebase-app: ModuleBase() Missing module name');
    invariant(config.namespace, 'Error: expo-firebase-app: ModuleBase() Missing namespace');
    const { moduleName } = config;
    this._app = app;
    this._customUrlOrRegion = customUrlOrRegion;
    this.namespace = config.namespace;
    this.getAppEventName = this.getAppEventName.bind(this);
    // check if native module exists as all native
    initialiseNativeModule(this, config, customUrlOrRegion);
    initialiseLogger(this, `${app.name}:${moduleName.replace('ExpoFirebase', '')}`);
  }

  getAppEventName(eventName?: string): string {
    invariant(
      eventName,
      'Error: expo-firebase-app: ModuleBase.getAppEventName() requires a valid eventName'
    );
    return `${this.app.name}-${eventName}`;
  }

  /**
   * Returns the App instance for current module
   * @return {*}
   */
  get app(): App {
    return this._app;
  }

  get nativeModule(): any {
    return getNativeModule(this);
  }

  get logger(): any {
    return getLogger(this);
  }
}
