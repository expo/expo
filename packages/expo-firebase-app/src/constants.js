export const FirebaseNamespaces = {
  admob: 'admob',
  analytics: 'analytics',
  auth: 'auth',
  config: 'config',
  crash: 'crash',
  crashlytics: 'crashlytics',
  database: 'database',
  firestore: 'firestore',
  functions: 'functions',
  iid: 'iid',
  invites: 'invites',
  links: 'links',
  messaging: 'messaging',
  notifications: 'notifications',
  perf: 'perf',
  storage: 'storage',
  utils: 'utils',
  vision: 'vision',
};

export const FirebasePackages = {
  // admob() {
  //   return require('')
  // },
  analytics() {
    return require('expo-firebase-analytics');
  },
  auth() {
    return require('expo-firebase-auth');
  },
  config() {
    return require('expo-firebase-remote-config');
  },
  crashlytics() {
    return require('expo-firebase-crashlytics');
  },
  database() {
    return require('expo-firebase-database');
  },
  firestore() {
    return require('expo-firebase-firestore');
  },
  functions() {
    return require('expo-firebase-functions');
  },
  iid() {
    return require('expo-firebase-instance-id');
  },
  invites() {
    return require('expo-firebase-invites');
  },
  links() {
    return require('expo-firebase-links');
  },
  messaging() {
    return require('expo-firebase-messaging');
  },
  notifications() {
    return require('expo-firebase-notifications');
  },
  perf() {
    return require('expo-firebase-performance');
  },
  storage() {
    return require('expo-firebase-storage');
  },
  // utils() {
  //   return require('expo-firebase-utils')
  // },
  // vision() {
  //   return require('expo-firebase-vision')
  // },
};

export const FirebaseModuleNames = {
  ExpoFirebaseAdMob: 'ExpoFirebaseAdMob',
  ExpoFirebaseAnalytics: 'ExpoFirebaseAnalytics',
  ExpoFirebaseAuth: 'ExpoFirebaseAuth',
  ExpoFirebaseRemoteConfig: 'ExpoFirebaseRemoteConfig',
  ExpoFirebaseCrash: 'ExpoFirebaseCrash',
  ExpoFirebaseCrashlytics: 'ExpoFirebaseCrashlytics',
  ExpoFirebaseDatabase: 'ExpoFirebaseDatabase',
  ExpoFirebaseFirestore: 'ExpoFirebaseFirestore',
  ExpoFirebaseFunctions: 'ExpoFirebaseFunctions',
  ExpoFirebaseInstanceId: 'ExpoFirebaseInstanceId',
  ExpoFirebaseInvites: 'ExpoFirebaseInvites',
  ExpoFirebaseLinks: 'ExpoFirebaseLinks',
  ExpoFirebaseMessaging: 'ExpoFirebaseMessaging',
  ExpoFirebaseNotifications: 'ExpoFirebaseNotifications',
  ExpoFirebasePerformance: 'ExpoFirebasePerformance',
  ExpoFirebaseStorage: 'ExpoFirebaseStorage',
  ExpoFirebaseUtils: 'ExpoFirebaseUtils',
  ExpoFirebaseVision: 'ExpoFirebaseVision',
};
