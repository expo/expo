import * as Analytics from 'expo-firebase-analytics';
import { Platform } from 'react-native';

export const name = 'FirebaseAnalytics';

export async function test({ describe, beforeAll, afterAll, it, expect }) {
  describe(name, () => {
    /*
    const googleServices = Platform.select({
        android: {},
        ios: {},
        web: {},
    });

    Analytics.initializeAppDangerously(googleServices);
    */

    beforeAll(async () => {
      await Analytics.deleteApp({});

      await Analytics.initializeAppDangerously(
        Platform.select({
          //   android: require('bare-expo/google-services.json'),
          ios: {
            CLIENT_ID: '1026763265415-4t723ioaqvjgbipp72ojp81hu529on4j.apps.googleusercontent.com',
            REVERSED_CLIENT_ID:
              'com.googleusercontent.apps.1026763265415-4t723ioaqvjgbipp72ojp81hu529on4j',
            API_KEY: 'AIzaSyBgH9mo9R8WGN4tcuf7M3HZHVj44zSDvs4',
            GCM_SENDER_ID: '1026763265415',
            PLIST_VERSION: '1',
            BUNDLE_ID: 'dev.expo.Payments',
            PROJECT_ID: 'test-suite-ecd20',
            STORAGE_BUCKET: 'test-suite-ecd20.appspot.com',
            IS_ADS_ENABLED: false,
            IS_ANALYTICS_ENABLED: true,
            IS_APPINVITE_ENABLED: true,
            IS_GCM_ENABLED: true,
            IS_SIGNIN_ENABLED: true,
            GOOGLE_APP_ID: '1:1026763265415:ios:d138a28b64768c9ee8af22',
            DATABASE_URL: 'https://test-suite-ecd20.firebaseio.com',
          },
        })
      );
      await Analytics.resetAnalyticsData();
      await Analytics.setAnalyticsCollectionEnabled(true);
      console.log('Bundle: ', Analytics.getBundledGoogleServicesConfig());
    });

    afterAll(async () => {
      await Analytics.deleteApp({});
    });

    describe('logEvent()', async () => {
      it(`runs`, async () => {
        let error = null;
        try {
          await Analytics.logEvent('event_name', { foo: 'bar' });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
    describe('setCurrentScreen()', async () => {
      it(`runs`, async () => {
        let error = null;
        try {
          await Analytics.setCurrentScreen('test-screen');
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
    describe('setSessionTimeoutDuration()', async () => {
      it(Platform.select({ android: 'runs', default: 'throws unavailable' }), async () => {
        let error = null;
        try {
          await Analytics.setSessionTimeoutDuration(190000);
        } catch (e) {
          error = e;
        }
        if (Platform.OS === 'android') {
          expect(error).toBeNull();
        } else {
          expect(error).not.toBeNull();
        }
      });
    });
    describe('setUserId()', async () => {
      afterAll(async () => {
        await Analytics.setUserId(null);
      });
      it(`runs`, async () => {
        let error = null;
        try {
          await Analytics.setUserId('abcuserid');
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
    describe('setUserProperty()', async () => {
      it(`runs`, async () => {
        let error = null;
        try {
          await Analytics.setUserProperty('likes_tests', 'true');
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
    describe('setUserProperties()', async () => {
      it(`runs`, async () => {
        let error = null;
        try {
          await Analytics.setUserProperties({ likes_tests: 'true' });
        } catch (e) {
          error = e;
        }
        expect(error).toBeNull();
      });
    });
  });
}
