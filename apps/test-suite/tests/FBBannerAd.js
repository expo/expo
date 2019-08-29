'use strict';

import React from 'react';
import * as FacebookAds from 'expo-ads-facebook';
import { mountAndWaitForWithTimeout } from './helpers';

const { BannerAd, AdSettings } = FacebookAds;

AdSettings.addTestDevice(AdSettings.currentDeviceHash);

export const name = 'BannerAd';

export function canRunAsync({ isDetox }) {
  return !isDetox;
}

// If tests didn't pass check placementId
// Probably test won't pass if you are not logged into account connected
// with placement id.

const placementId = '629712900716487_662949307392846';

export function test(
  { describe, afterEach, it, expect, jasmine, ...t },
  { setPortalChild, cleanupPortal }
) {
  describe('FacebookAds.BannerView', () => {
    afterEach(async () => await cleanupPortal());

    describe('when given a valid placementId', () => {
      it("doesn't call onError", async () => {
        try {
          await mountAndWaitForWithTimeout(
            <BannerAd type="large" placementId={placementId} />,
            'onError',
            setPortalChild,
            1000
          );
        } catch (e) {
          expect(e.name).toEqual('TimeoutError');
        }
      });
    });

    describe('when given no placementId', () => {
      it('calls onError', async () => {
        const error = await mountAndWaitForWithTimeout(
          <BannerAd type="large" placementId="" />,
          'onError',
          setPortalChild,
          30000
        );
        expect(error).toBeDefined();
      }, 30000);
    });
  });
}
