/* @flow */
import type ModuleBase from './utils/ModuleBase';
import type Utils from './utils';
import { typeof statics as UtilsStatics } from './utils';

/* Core types */
export type FirebaseError = {
  message: string,
  name: string,
  code: string,
  stack: string,
  path: string,
  details: string,
  modifiers: string,
};

export type FirebaseModule = $Subtype<ModuleBase>;

export type FirebaseModuleConfig = {
  events?: string[],
  moduleName: FirebaseModuleName,
  multiApp: boolean,
  hasShards: boolean,
  namespace: FirebaseNamespace,
};

export type FirebaseModuleName =
  | 'ExpoFirebaseAdMob'
  | 'ExpoFirebaseAnalytics'
  | 'ExpoFirebaseAuth'
  | 'ExpoFirebaseRemoteConfig'
  | 'ExpoFirebaseCrash'
  | 'ExpoFirebaseCrashlytics'
  | 'ExpoFirebaseDatabase'
  | 'ExpoFirebaseFirestore'
  | 'ExpoFirebaseFunctions'
  | 'ExpoFirebaseInstanceId'
  | 'ExpoFirebaseInvites'
  | 'ExpoFirebaseLinks'
  | 'ExpoFirebaseMessaging'
  | 'ExpoFirebaseNotifications'
  | 'ExpoFirebasePerformance'
  | 'ExpoFirebaseStorage'
  | 'ExpoFirebaseUtils';

export type FirebaseNamespace =
  | 'admob'
  | 'analytics'
  | 'auth'
  | 'config'
  | 'crash'
  | 'crashlytics'
  | 'database'
  | 'firestore'
  | 'functions'
  | 'iid'
  | 'invites'
  | 'links'
  | 'messaging'
  | 'notifications'
  | 'perf'
  | 'storage'
  | 'utils';

export type FirebaseOptions = {
  apiKey: string,
  appId: string,
  databaseURL: string,
  messagingSenderId: string,
  projectId: string,
  storageBucket: string,
};

export type FirebaseModuleAndStatics<M: FirebaseModule, S: FirebaseStatics> = {
  (): M,
  nativeModuleExists: boolean,
} & S;

export type FirebaseStatics = $Subtype<Object>;

/* Utils types */

export type UtilsModule = {
  (): Utils,
  nativeModuleExists: boolean,
} & UtilsStatics;
