'use strict';
import { PublisherBanner } from 'expo-ads-admob';
import { forEach } from 'lodash';
import React from 'react';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'AdMobPublisherBanner';

export function canRunAsync({ isDetox, isDeviceFarm }) {
  return !isDetox && !isDeviceFarm;
}

const validAdUnitID = 'ca-app-pub-3940256099942544/6300978111';
const invalidAdUnitID = 'id';

const sizes = [
  'banner',
  'largeBanner',
  'mediumRectangle',
  // 'fullBanner',  only supported
  // 'leaderboard', by tablets
  'smartBannerPortrait',
  'smartBannerLandscape',
];

export function test(
  { describe, afterEach, it, expect, jasmine, ...t },
  { setPortalChild, cleanupPortal }
) {
  describe('PublisherBanner', () => {
    afterEach(async () => await cleanupPortal());

    const mountAndWaitFor = (child, propName = 'onAdViewDidReceiveAd') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    describe('when given valid adUnitID', () => {
      it('calls adViewDidReceiveAd', async () => {
        await mountAndWaitFor(
          <PublisherBanner bannerSize="banner" adUnitID={validAdUnitID} testDeviceID="EMULATOR" />,
          'onAdViewDidReceiveAd'
        );
      });
      it('displays an ad', async () => {
        await mountAndWaitFor(
          <PublisherBanner bannerSize="banner" adUnitID={validAdUnitID} testDeviceID="EMULATOR" />
        );
      });

      forEach(sizes, size => {
        describe(`when given size = ${size}`, () => {
          it('displays an ad', async () => {
            await mountAndWaitFor(
              <PublisherBanner bannerSize={size} adUnitID={validAdUnitID} testDeviceID="EMULATOR" />
            );
          });
        });
      });
    });

    describe('when given invalid adUnitID', () => {
      it('calls didFailToReceiveAdWithError', async () => {
        await mountAndWaitFor(
          <PublisherBanner
            bannerSize="banner"
            adUnitID={invalidAdUnitID}
            testDeviceID="EMULATOR"
          />,
          'onDidFailToReceiveAdWithError'
        );
      });
    });
  });
}
