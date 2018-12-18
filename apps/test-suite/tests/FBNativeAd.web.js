import { FacebookAds } from 'expo';
import { Platform } from 'expo-core';
import { UnavailabilityError } from 'expo-errors';

const {
  NativeAdsManager,
  AdSettings,
  withNativeAd,
  AdMediaView,
  AdIconView,
  AdTriggerView,
} = FacebookAds;

export const name = 'NativeAd';

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

  describe('NativeAdsManager', () => {
    it(unavailableMessage, () => executeFailingMethod(NativeAdsManager));
  });
  describe('AdSettings', () => {
    it(unavailableMessage, () => executeFailingMethod(AdSettings));
  });
  describe('withNativeAd', () => {
    it(unavailableMessage, () => executeFailingMethod(withNativeAd));
  });
  describe('AdMediaView', () => {
    it(unavailableMessage, () => executeFailingMethod(AdMediaView));
  });
  describe('AdIconView', () => {
    it(unavailableMessage, () => executeFailingMethod(AdIconView));
  });
  describe('AdTriggerView', () => {
    it(unavailableMessage, () => executeFailingMethod(AdTriggerView));
  });
}
