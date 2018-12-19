import { AdMobInterstitial } from 'expo-ads-admob';
import { Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

export const name = 'AdMobInterstitial';

const unavailableMessage = `is unavailable on ${Platform.OS}`;

/* AFAIK there is no native API for using Contacts on the web platform. */

export async function test({ describe, it, expect }) {
  async function executeFailingMethod(method) {
    try {
      await method();
      expect(true).toBe(false);
    } catch (error) {
      expect(error instanceof UnavailabilityError).toBeTruthy();
    }
  }

  ['setAdUnitID', 'setTestDeviceID', 'requestAdAsync', 'dismissAdAsync', 'showAdAsync'].map(
    unsupportedMethod => {
      describe(`${name}.${unsupportedMethod}()`, () => {
        it(unavailableMessage, () => executeFailingMethod(AdMobInterstitial[unsupportedMethod]));
      });
    }
  );

  ['getIsReadyAsync'].map(unsupportedMethod => {
    describe(`${name}.${unsupportedMethod}()`, () => {
      it('method returns falsey', async () => {
        const value = await AdMobInterstitial[unsupportedMethod]();
        expect(!!value).toBe(false);
      });
    });
  });
}
