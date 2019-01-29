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
  hasMultiAppSupport: boolean,
  hasCustomUrlSupport?: boolean,
  hasRegionsSupport?: boolean,
  namespace: FirebaseNamespace,
};

// TODO: Bacon: Add this
export type App = object;

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
  | 'analytics'
  | 'auth'
  | 'config'
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

export type NativeErrorObject = {
  code: string,
  message: string,
  nativeErrorCode: string | number,
  nativeErrorMessage: string,
};

export type NativeErrorResponse = {
  error: NativeErrorObject,
  // everything else
  [key: string]: ?any,
};

export interface NativeErrorInterface extends Error {
  +code: string;
  +message: string;
  +nativeErrorCode: string | number;
  +nativeErrorMessage: string;
}
