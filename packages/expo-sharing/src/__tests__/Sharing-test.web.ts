import { mockProperty, unmockProperty } from 'jest-expo';

import * as Sharing from '../Sharing';

describe('Sharing', () => {
  describe('isAvailableAsync', () => {
    if (typeof navigator !== 'undefined') {
      describe('browser', () => {
        it(`returns true if navigator.share is defined`, async () => {
          mockProperty(navigator, 'share', true);
          let isAvailable = await Sharing.isAvailableAsync();
          expect(isAvailable).toBeTruthy();
          unmockProperty(navigator, 'share');
        });
      });
    } else {
      describe('node', () => {
        it(`returns false`, async () => {
          let isAvailable = await Sharing.isAvailableAsync();
          expect(isAvailable).toBeFalsy();
        });
      });
    }
  });
});
