import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FirebaseCore from 'expo-firebase-core';
import './FirebaseInit';

export const name = 'FirebaseCore';

const SYSTEM_APP_NAME = '[DEFAULT]';

const SANDBOX_APP_PREFIX = '__sandbox';

/*
function getTestSuiteFirebaseAppOptions() {
  if (Platform.OS === 'android') {
    //const googleServicesJson = require('../google-services.json');
    //const options = FirebaseCore.FirebaseOptions.parseAndroidGoogleServices(googleServicesJson);
    ///return options;
    throw new Error('TODO ANDROID');
  } else if (Platform.OS === 'ios') {
    // TODO, load PLIST using babel-loader?
    return {
      clientId: '1082251606918-ktto2c4d3tit64uikmki48j7520qensp.apps.googleusercontent.com',
      apiKey: 'AIzaSyBH7Pa-tgLgL2QK6DgGhKipuDTbKqU6Wlk',
      storageBucket: 'expo-test-suite.appspot.com',
      projectId: 'expo-test-suite',
      appId: '1:1082251606918:ios:f448eb8df0adab41e24a07',
      databaseURL: 'https://expo-test-suite.firebaseio.com',
      messagingSenderId: '1082251606918',
    };
  } else {
    throw new Error('Platform not supported');
  }
}

function expectFirebaseOptions(expect, options1, options2) {
  expect(options1.appId).toBe(options2.appId);
  expect(options1.messagingSenderId).toBe(options2.messagingSenderId);
  expect(options1.apiKey).toBe(options2.apiKey);
  expect(options1.projectId).toBe(options2.projectId);
  expect(options1.clientId).toBe(options2.clientId);
  expect(options1.storageBucket).toBe(options2.storageBucket);
  expect(options1.databaseURL).toBe(options2.databaseURL);
}*/

export async function test({ describe, it, xit, expect, beforeAll }) {
  if (!FirebaseCore.DEFAULT_APP_OPTIONS) {
    describe(name, () => {
      xit(
        Platform.select({
          ios: `No Google services configuration found. In order to run this test, set the 'ios.googleServicesFile' field in 'app.json'. When you are running a bare project, add 'GoogleService-Info.plist' to your XCode project.`,
          android: `No Google services configuration found. In order to run this test, set the 'android.googleServicesFile' field in 'app.json'. When you are running a bare project, add 'google-services.json' to 'android/app'`,
          web: `The web platform is currently not supported for this test`,
        }),
        async () => {}
      );
    });
    return;
  }

  const isSandboxed = Constants.appOwnership === 'expo';
  const itWhenSandboxed = isSandboxed ? it : xit;
  const itWhenNotSandboxed = isSandboxed ? xit : it;

  describe(name, () => {
    describe('DEFAULT_APP_NAME', async () => {
      itWhenSandboxed(`returns a sandboxed app name`, async () => {
        let error = null;
        try {
          const { DEFAULT_APP_NAME } = FirebaseCore;
          expect(DEFAULT_APP_NAME.substring(0, SANDBOX_APP_PREFIX.length)).toBe(SANDBOX_APP_PREFIX);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      itWhenNotSandboxed(`returns the default app name`, async () => {
        let error = null;
        try {
          const { DEFAULT_APP_NAME } = FirebaseCore;
          expect(DEFAULT_APP_NAME).toBe(SYSTEM_APP_NAME);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('DEFAULT_APP_OPTIONS', async () => {
      it(`returns valid firebase options`, async () => {
        let error = null;
        try {
          const { DEFAULT_APP_OPTIONS } = FirebaseCore;
          expect(DEFAULT_APP_OPTIONS).toBeDefined();
          expect(DEFAULT_APP_OPTIONS.appId).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.appId.indexOf(`:${Platform.OS}:`)).toBeGreaterThan(0);
          expect(DEFAULT_APP_OPTIONS.messagingSenderId).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.messagingSenderId.length).toBeGreaterThan(10);
          expect(DEFAULT_APP_OPTIONS.apiKey).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.apiKey.length).toBeGreaterThan(30);
          expect(DEFAULT_APP_OPTIONS.projectId).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.projectId.length).toBeGreaterThan(2);
          if (Platform.OS === 'ios') {
            expect(DEFAULT_APP_OPTIONS.clientId).not.toBeNull();
            expect(DEFAULT_APP_OPTIONS.clientId.indexOf('googleusercontent.com')).toBeGreaterThan(
              0
            );
          }
          expect(DEFAULT_APP_OPTIONS.storageBucket).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.storageBucket.indexOf('appspot.com')).toBeGreaterThan(0);
          expect(DEFAULT_APP_OPTIONS.databaseURL).not.toBeNull();
          expect(DEFAULT_APP_OPTIONS.databaseURL.indexOf('firebaseio.com')).toBeGreaterThan(0);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      /*itWhenSandboxed(`returns the firebase options from the test-suite`, async () => {
        let error = null;
        try {
          const { DEFAULT_APP_OPTIONS } = FirebaseCore;
          expectFirebaseOptions(expect, DEFAULT_APP_OPTIONS, getTestSuiteFirebaseAppOptions());
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });*/
    });
  });
}
