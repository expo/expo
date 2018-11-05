'use strict';

import React from 'react';
import { forEach } from 'lodash';
import { AdMobBanner } from 'expo';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'AdMobBanner';

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

export function test(t, { setPortalChild, cleanupPortal }) {
  t.describe('AdMobBanner', () => {
    t.afterEach(async () => await cleanupPortal());

    const mountAndWaitFor = (child, propName = 'onAdViewDidReceiveAd') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    t.describe('when given valid adUnitID', () => {
      t.it('calls adViewDidReceiveAd', async () => {
        await mountAndWaitFor(
          <AdMobBanner bannerSize="banner" adUnitID={validAdUnitID} testDeviceID="EMULATOR" />,
          'onAdViewDidReceiveAd'
        );
      });

      t.it('displays an ad', async () => {
        await mountAndWaitFor(
          <AdMobBanner bannerSize="banner" adUnitID={validAdUnitID} testDeviceID="EMULATOR" />
        );
      });

      forEach(sizes, size => {
        t.describe(`when given size = ${size}`, () => {
          t.it('displays an ad', async () => {
            await mountAndWaitFor(
              <AdMobBanner bannerSize={size} adUnitID={validAdUnitID} testDeviceID="EMULATOR" />
            );
          });
        });
      });
    });

    t.describe('when given invalid adUnitID', () => {
      t.it('calls didFailToReceiveAdWithError', async () => {
        await mountAndWaitFor(
          <AdMobBanner bannerSize="banner" adUnitID={invalidAdUnitID} testDeviceID="EMULATOR" />,
          'onDidFailToReceiveAdWithError'
        );
      });
    });
  });
}
