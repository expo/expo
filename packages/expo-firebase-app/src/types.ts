/* Core types */
export type FirebaseError = {
  message: string;
  name: string;
  code: string;
  stack: string;
  path: string;
  details: string;
  modifiers: string;
};

export type FirebaseModule = any;

export type FirebaseModuleConfig = {
  statics?: any;
  events?: string[];
  moduleName: FirebaseModuleName;
  hasMultiAppSupport: boolean;
  hasCustomUrlSupport?: boolean;
  hasRegionsSupport?: boolean;
  namespace: FirebaseNamespace;
};

// TODO: Bacon: Add this
export type App = any;

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
  | 'ExpoFirebaseInstanceID'
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
  apiKey: string;
  appId: string;
  databaseURL: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
};

export type FirebaseModuleAndStatics<FirebaseModule, FirebaseStatics> = {
  (): FirebaseModule;
  nativeModuleExists: boolean;
} & FirebaseStatics;

export type FirebaseStatics = any;

/* Utils types */

export type NativeErrorObject = {
  code: string;
  message: string;
  nativeErrorCode?: string | number;
  nativeErrorMessage?: string;
};

export type NativeErrorResponse = {
  error: NativeErrorObject;
  // everything else
  [key: string]: any;
};

export interface NativeErrorInterface extends Error {
  code: string;
  nativeErrorCode?: string | number;
  nativeErrorMessage?: string;
}
