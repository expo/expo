import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FirebaseCore from 'expo-firebase-core';

export const name = 'FirebaseCore';

const SYSTEM_APP_NAME = '[DEFAULT]';

const SANDBOX_APP_PREFIX = '__sandbox';

function getTestSuiteFirebaseOptions() {
  if (Platform.OS === 'android') {
    const googleServicesJson = require('../google-services.json');
    const options = FirebaseCore.FirebaseOptions.parseAndroidGoogleServices(googleServicesJson);
    return options;
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
}

export async function test({ describe, it, xit, expect, beforeAll }) {
  const isSandboxed = Constants.appOwnership === 'expo';
  const itWhenSandboxed = isSandboxed ? it : xit;
  const itWhenNotSandboxed = isSandboxed ? xit : it;

  describe(name, () => {
    describe('DEFAULT_NAME', async () => {
      itWhenSandboxed(`returns a sandboxed app name`, async () => {
        let error = null;
        try {
          const { DEFAULT_NAME } = FirebaseCore;
          expect(DEFAULT_NAME.substring(0, SANDBOX_APP_PREFIX.length)).toBe(SANDBOX_APP_PREFIX);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      itWhenNotSandboxed(`returns the default app name`, async () => {
        let error = null;
        try {
          const { DEFAULT_NAME } = FirebaseCore;
          expect(DEFAULT_NAME).toBe(SYSTEM_APP_NAME);
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });

    describe('DEFAULT_OPTIONS', async () => {
      it(`returns valid firebase options`, async () => {
        let error = null;
        try {
          const { DEFAULT_OPTIONS } = FirebaseCore;
          expect(DEFAULT_OPTIONS.appId).not.toBeNull();
          expect(DEFAULT_OPTIONS.messagingSenderId).not.toBeNull();
          expect(DEFAULT_OPTIONS.apiKey).not.toBeNull();
          expect(DEFAULT_OPTIONS.projectId).not.toBeNull();
          expect(DEFAULT_OPTIONS.clientId).not.toBeNull();
          expect(DEFAULT_OPTIONS.storageBucket).not.toBeNull();
          expect(DEFAULT_OPTIONS.databaseURL).not.toBeNull();
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
      itWhenSandboxed(`returns the firebase options from the test-suite`, async () => {
        let error = null;
        try {
          const { DEFAULT_OPTIONS } = FirebaseCore;
          expectFirebaseOptions(expect, DEFAULT_OPTIONS, getTestSuiteFirebaseOptions());
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
  });
}
