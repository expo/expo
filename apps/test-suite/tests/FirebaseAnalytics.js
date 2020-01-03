import * as Analytics from 'expo-firebase-analytics';

export const name = 'FirebaseAnalytics';

export async function test({ describe, it, expect }) {
  describe(name, () => {
    /*
    const googleServices = Platform.select({
        android: {},
        ios: {},
        web: {},
    });

    Analytics.initializeAppDangerously(googleServices);
    */

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
  });
}
