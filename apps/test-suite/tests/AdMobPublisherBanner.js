'use strict';
import { PublisherBanner, setTestDeviceIDAsync } from 'expo-ads-admob';
import { forEach } from 'lodash';
import React from 'react';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

export const name = 'AdMobPublisherBanner';

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
  t.describe('PublisherBanner', () => {
    t.beforeAll(async () => await setTestDeviceIDAsync('EMULATOR'));
    t.afterEach(async () => await cleanupPortal());

    const mountAndWaitFor = (child, propName = 'onAdViewDidReceiveAd') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    t.describe('when given valid adUnitID', () => {
      t.it('calls adViewDidReceiveAd', async () => {
        await mountAndWaitFor(
          <PublisherBanner bannerSize="banner" adUnitID={validAdUnitID} />,
          'onAdViewDidReceiveAd'
        );
      });
      t.it('displays an ad', async () => {
        await mountAndWaitFor(<PublisherBanner bannerSize="banner" adUnitID={validAdUnitID} />);
      });

      forEach(sizes, size => {
        t.describe(`when given size = ${size}`, () => {
          t.it('displays an ad', async () => {
            await mountAndWaitFor(<PublisherBanner bannerSize={size} adUnitID={validAdUnitID} />);
          });
        });
      });
    });

    t.describe('when given invalid adUnitID', () => {
      t.it('calls didFailToReceiveAdWithError', async () => {
        await mountAndWaitFor(
          <PublisherBanner bannerSize="banner" adUnitID={invalidAdUnitID} />,
          'onDidFailToReceiveAdWithError'
        );
      });
    });
  });
}
