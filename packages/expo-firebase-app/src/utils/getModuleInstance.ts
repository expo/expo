// @flow
import INTERNALS from './internals';

const FirebasePackages = {
  get analytics() {
    return require('expo-firebase-analytics').default;
  },
  get auth() {
    return require('expo-firebase-auth').default;
  },
  get config() {
    return require('expo-firebase-remote-config').default;
  },
  get crashlytics() {
    return require('expo-firebase-crashlytics').default;
  },
  get database() {
    return require('expo-firebase-database').default;
  },
  get firestore() {
    return require('expo-firebase-firestore').default;
  },
  get functions() {
    return require('expo-firebase-functions').default;
  },
  get iid() {
    return require('expo-firebase-instance-id').default;
  },
  get invites() {
    return require('expo-firebase-invites').default;
  },
  get links() {
    return require('expo-firebase-links').default;
  },
  get messaging() {
    return require('expo-firebase-messaging').default;
  },
  get notifications() {
    return require('expo-firebase-notifications').default;
  },
  get perf() {
    return require('expo-firebase-performance').default;
  },
  get storage() {
    return require('expo-firebase-storage').default;
  },
  get utils() {
    return require('./UtilsModule').default;
  },
};

export default function getModuleInstance(name: string) {
  try {
    return FirebasePackages[name];
  } catch (error) {
    // TODO: Bacon: these aren't correct iid => expo-firebase-instance-id
    throw new Error(INTERNALS.STRINGS.ERROR_MISSING_IMPORT(name));
  }
}
