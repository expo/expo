import * as Facebook from 'expo-facebook';
import { Platform } from 'react-native';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';
import { isInteractive } from '../utils/Environment';

export const name = 'Facebook';

const longerTimeout = 15000 * 3;

export async function test(
  { it, describe, beforeAll, jasmine, afterAll, expect, afterEach, beforeEach },
  { setPortalChild, cleanupPortal }
) {
  let originalTimeout;

  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = longerTimeout;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  const mountAndWaitFor = (child, propName = 'onLayout') =>
    originalMountAndWaitFor(child, propName, setPortalChild);

  describe(name, () => {
    beforeAll(async () => {
      await Facebook.initializeAsync({
        appId: '629712900716487',
        version: Platform.select({
          web: 'v5',
        }),
      });
      await Facebook.logOutAsync();
    });

    if (isInteractive()) {
      it(`authenticates, gets data, and logs out`, async () => {
        const result = await Facebook.logInWithReadPermissionsAsync({ behavior: 'fsef' });
        expect(result.type).toBeDefined();
        const accessToken = await Facebook.getAccessTokenAsync();
        expect(accessToken).toBeDefined();

        const me = await Facebook.getUserAsync();
        expect(me.name).toBeDefined();
        expect(me.id).toBe(accessToken.userID);

        await Facebook.logOutAsync();
        const unauthAccessToken = await Facebook.getAccessTokenAsync();
        expect(unauthAccessToken).toBe(null);
      });
    } else {
      it(`does nothing in non-interactive environments`, async () => {});
    }
  });
}
