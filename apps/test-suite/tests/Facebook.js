import { Platform } from '@unimodules/core';
import * as Device from 'expo-device';
import * as Facebook from 'expo-facebook';

import { isInteractive } from '../utils/Environment';

export const name = 'Facebook';

const interactiveTimeout = 15000 * 3;

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  if (isInteractive()) {
    let originalTimeout;
    beforeEach(() => {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = interactiveTimeout;
    });

    afterEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  }

  describe(name, () => {
    beforeAll(async () => {
      await Facebook.initializeAsync({
        appId: '629712900716487',
        version: Platform.select({
          web: 'v5.0',
        }),
      });
      await Facebook.logOutAsync();
    });

    if (isInteractive()) {
      it(`authenticates, gets data, and logs out`, async () => {
        const result = await Facebook.logInWithReadPermissionsAsync();
        expect(result.type).toBeDefined();
        const credential = await Facebook.getAuthenticationCredentialAsync();
        expect(credential).not.toBe(null);
        await Facebook.logOutAsync();
        const loggedOutCredential = await Facebook.getAuthenticationCredentialAsync();
        expect(loggedOutCredential).toBe(null);
      });
    } else {
      it(`calls setAdvertiserTrackingEnabled`, async () => {
      const result = await Facebook.setAdvertiserTrackingEnabledAsync(true);
        if (Platform.OS === 'ios') {
          if (parseInt(Device.osVersion, 10) >= 14) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          } 
        } else {
          expect(result).toBe(false);
        }
      });
    }
  });
}
