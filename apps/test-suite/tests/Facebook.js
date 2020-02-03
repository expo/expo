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
      await Facebook.initializeAsync('629712900716487');
    });

    if (isInteractive()) {
      it(`authenticates, gets data, and logs out`, async () => {});
    } else {
      it(`does nothing in non-interactive environments`, async () => {});
    }
  });
}
