import Constants from 'expo-constants';
import * as FirebaseCore from 'expo-firebase-core';
import { Platform } from 'react-native';

export const name = 'FirebaseCore';

const SYSTEM_APP_NAME = '[DEFAULT]';

const SANDBOX_APP_PREFIX = '__sandbox';

export async function test({ describe, it, xit, expect, beforeAll }) {
  if (!FirebaseCore.DEFAULT_APP_OPTIONS) {
    describe(name, () => {
      xit(
        Platform.select({
          ios: `No Google services configuration found. In order to run this test, set the 'ios.googleServicesFile' field in 'app.json'. When you are running a bare project, add 'GoogleService-Info.plist' to your XCode project.`,
          android: `No Google services configuration found. In order to run this test, set the 'android.googleServicesFile' field in 'app.json'. When you are running a bare project, add 'google-services.json' to 'android/app'`,
          web: `No Firebase configuration found. In order to run this test, set the 'web.config.firebase' field in 'app.json'.`,
        }),
        async () => {}
      );
    });
    return;
  }

  const isSandboxed = Constants.appOwnership === 'expo' && Platform.OS !== 'web';
  const itWhenSandboxed = isSandboxed ? it : xit;
  const itWhenNotSandboxed = isSandboxed ? xit : it;

  describe(name, () => {
    describe('DEFAULT_APP_NAME', async () => {
      itWhenSandboxed(`returns a sandboxed app name`, async () => {
        let error = null;
        try {
          const { DEFAULT_APP_NAME } = FirebaseCore;
          expect(DEFAULT_APP_NAME.startsWith(SANDBOX_APP_PREFIX)).toBeTrue();
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
    });
  });
}
