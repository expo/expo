import { FacebookAds } from 'expo';
import { Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

const { BannerAd, AdSettings } = FacebookAds;

export const name = 'BannerAd';

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

  describe('BannerAd', () => {
    it(unavailableMessage, () => executeFailingMethod(BannerAd));
  });
  describe('AdSettings', () => {
    it(unavailableMessage, () => executeFailingMethod(AdSettings));
  });
}
