/**
 * @flow
 */
import { Platform } from 'expo-core';

const NAMESPACE_PODS = {
  admob: 'Firebase/AdMob',
  analytics: 'Firebase/Analytics',
  auth: 'Firebase/Auth',
  config: 'Firebase/RemoteConfig',
  crash: 'Firebase/Crash',
  database: 'Firebase/Database',
  links: 'Firebase/DynamicLinks',
  messaging: 'Firebase/Messaging',
  perf: 'Firebase/Performance',
  storage: 'Firebase/Storage',
};

const GRADLE_DEPS = {
  admob: 'ads',
};

const PLAY_SERVICES_CODES = {
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  1: {
    code: 'SERVICE_MISSING',
    message: 'Google Play services is missing on this device.',
  },
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  2: {
    code: 'SERVICE_VERSION_UPDATE_REQUIRED',
    message: 'The installed version of Google Play services on this device is out of date.',
  },
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  3: {
    code: 'SERVICE_DISABLED',
    message: 'The installed version of Google Play services has been disabled on this device.',
  },
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  9: {
    code: 'SERVICE_INVALID',
    message: 'The version of the Google Play services installed on this device is not authentic.',
  },
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  18: {
    code: 'SERVICE_UPDATING',
    message: 'Google Play services is currently being updated on this device.',
  },
  // $FlowExpectedError: Doesn't like numerical object keys: https://github.com/facebook/flow/issues/380
  19: {
    code: 'SERVICE_MISSING_PERMISSION',
    message: "Google Play service doesn't have one or more required permissions.",
  },
};

export default {
  // default options
  OPTIONS: {
    logLevel: 'warn',
    errorOnMissingPlayServices: true,
    promptOnMissingPlayServices: true,
  },

  FLAGS: {
    checkedPlayServices: false,
  },

  STRINGS: {
    WARN_INITIALIZE_DEPRECATION:
      "Deprecation: Calling 'initializeApp()' for apps that are already initialised natively " +
      "is unnecessary, use 'firebase.app()' instead to access the already initialized default app instance.",

    /**
     * @return {string}
     */
    get ERROR_MISSING_CORE() {
      if (Platform.OS === 'ios') {
        return (
          'ExpoFirebase core module was not found natively on iOS, ensure you have ' +
          'correctly included the ExpoFirebase pod in your projects `Podfile` and have run `pod install`.' +
          '\r\n\r\n See http://invertase.link/ios for the ios setup guide.'
        );
      }

      return (
        'ExpoFirebase core module was not found natively on Android, ensure you have ' +
        'correctly added the ExpoFirebase and Firebase gradle dependencies to your `android/app/build.gradle` file.' +
        '\r\n\r\n See http://invertase.link/android for the android setup guide.'
      );
    },

    ERROR_INIT_OBJECT: 'Firebase.initializeApp(options <-- requires a valid configuration object.',
    ERROR_INIT_STRING_NAME:
      'Firebase.initializeApp(options, name <-- requires a valid string value.',

    /**
     * @return {string}
     */
    ERROR_INIT_SERVICE_URL_UNSUPPORTED(namespace: string) {
      return `${namespace} does not support URL as a param, please pass in an app.`;
    },

    /**
     * @return {string}
     */
    ERROR_MISSING_CB(method: string) {
      return `Missing required callback for method ${method}().`;
    },

    /**
     * @return {string}
     */
    ERROR_MISSING_ARG(type: string, method: string) {
      return `Missing required argument of type '${type}' for method '${method}()'.`;
    },

    /**
     * @return {string}
     */
    ERROR_MISSING_ARG_NAMED(name: string, type: string, method: string) {
      return `Missing required argument '${name}' of type '${type}' for method '${method}()'.`;
    },

    /**
     * @return {string}
     */
    ERROR_ARG_INVALID_VALUE(name: string, expected: string, got: string) {
      return `Invalid value for argument '${name}' expected value '${expected}' but got '${got}'.`;
    },

    /**
     * @return {string}
     */
    ERROR_PROTECTED_PROP(name: string) {
      return `Property '${name}' is protected and can not be overridden by extendApp.`;
    },
    ERROR_MISSING_IMPORT(name: string) {
      return `Expo.Firebase: Module ${name} not included! Ensure it's installed with: yarn add expo-firebase-${name}`;
    },

    /**
     * @return {string}
     * @param namespace
     * @param nativeModule
     */
    ERROR_MISSING_MODULE(namespace: string, nativeModule: string) {
      const snippet = `firebase.${namespace}()`;
      if (Platform.OS === 'ios') {
        return (
          `You attempted to use a firebase module that's not installed natively on your iOS project by calling ${snippet}.` +
          '\r\n\r\nEnsure you have the required Firebase iOS SDK pod for this module included in your Podfile, in this instance ' +
          `confirm you've added "pod '${NAMESPACE_PODS[namespace]}'" to your Podfile` +
          '\r\n\r\nSee http://invertase.link/ios for full setup instructions.'
        );
      }

      const fbSDKDep = `'com.google.firebase:firebase-${GRADLE_DEPS[namespace] || namespace}'`;
      const exFirebasePackage = `'io.invertase.firebase.${namespace}.${nativeModule}Package'`;
      const newInstance = `'new ${nativeModule}Package()'`;
      return (
        `You attempted to use a firebase module that's not installed on your Android project by calling ${snippet}.` +
        `\r\n\r\nEnsure you have:\r\n\r\n1) Installed the required Firebase Android SDK dependency ${fbSDKDep} in your 'android/app/build.gradle' ` +
        `file.\r\n\r\n2) Imported the ${exFirebasePackage} module in your 'MainApplication.java' file.\r\n\r\n3) Added the ` +
        `${newInstance} line inside of the RN 'getPackages()' method list.` +
        '\r\n\r\nSee http://invertase.link/android for full setup instructions.'
      );
    },

    /**
     * @return {string}
     */
    ERROR_APP_NOT_INIT(appName: string) {
      return `The [${appName}] firebase app has not been initialized!`;
    },

    /**
     * @param optName
     * @return {string}
     * @constructor
     */
    ERROR_MISSING_OPT(optName: string) {
      return `Failed to initialize app. FirebaseOptions missing or invalid '${optName}' property.`;
    },

    /**
     * @return {string}
     */
    ERROR_NOT_APP(namespace: string) {
      return `Invalid App instance passed to firebase.${namespace}(app <--).`;
    },

    /**
     * @return {string}
     */
    ERROR_UNSUPPORTED_CLASS_METHOD(className: string, method: string) {
      return `${className}.${method}() is unsupported by the native Firebase SDKs.`;
    },

    /**
     * @return {string}
     */
    ERROR_UNSUPPORTED_CLASS_PROPERTY(className: string, property: string) {
      return `${className}.${property} is unsupported by the native Firebase SDKs.`;
    },

    /**
     * @return {string}
     */
    ERROR_UNSUPPORTED_MODULE_METHOD(namespace: string, method: string) {
      return `firebase.${namespace}().${method}() is unsupported by the native Firebase SDKs.`;
    },

    /**
     * @return {string}
     */
    ERROR_PLAY_SERVICES(statusCode: number) {
      const knownError = PLAY_SERVICES_CODES[statusCode];
      let start =
        'Google Play Services is required to run firebase services on android but a valid installation was not found on this device.';

      if (statusCode === 2) {
        start =
          'Google Play Services is out of date and may cause some firebase services like authentication to hang when used. It is recommended that you update it.';
      }

      // eslint-disable-next-line prefer-template
      return (
        `${`${start}\r\n\r\n-------------------------\r\n`}${
          knownError
            ? `${knownError.code}: ${knownError.message} (code ${statusCode})`
            : `A specific play store availability reason reason was not available (unknown code: ${statusCode})`
        }\r\n-------------------------` +
        `\r\n\r\n` +
        `For more information on how to resolve this issue, configure Play Services checks or for guides on how to validate Play Services on your users devices see the link below:` +
        `\r\n\r\nhttp://invertase.link/play-services`
      );
    },
  },
};
