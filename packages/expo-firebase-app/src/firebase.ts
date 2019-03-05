import { NativeModulesProxy } from '@unimodules/core';
import invariant from 'invariant';
import APPS from './utils/apps';
import INTERNALS from './utils/internals';
import App from './app';
import { FirebaseNamespaces } from './constants';
import { FirebaseOptions } from './types';

import getModuleInstance from './utils/getModuleInstance';

import {
  AdMobModule,
  AnalyticsModule,
  AuthModule,
  ConfigModule,
  CrashlyticsModule,
  DatabaseModule,
  FirestoreModule,
  FunctionsModule,
  InstanceIdModule,
  InvitesModule,
  LinksModule,
  MessagingModule,
  NotificationsModule,
  PerformanceModule,
  StorageModule,
  UtilsModule,
} from './module.types';

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
  // admob: AdMobModule;

  analytics: AnalyticsModule;

  auth: AuthModule;

  config: ConfigModule;

  crashlytics: CrashlyticsModule;

  database: DatabaseModule;

  firestore: FirestoreModule;

  functions: FunctionsModule;

  iid: InstanceIdModule;

  invites: InvitesModule;

  links: LinksModule;

  messaging: MessagingModule;

  notifications: NotificationsModule;

  perf: PerformanceModule;

  storage: StorageModule;

  utils: UtilsModule;

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
  get apps(): App[] {
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
