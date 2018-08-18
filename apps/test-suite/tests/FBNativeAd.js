'use strict';

import Expo from 'expo';
import React from 'react';
import { View, Text } from 'react-native';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

const {
  NativeAdsManager,
  AdSettings,
  withNativeAd,
  MediaView,
  AdIconView,
  TriggerableView,
} = Expo.FacebookAds;

AdSettings.addTestDevice(AdSettings.currentDeviceHash);

export const name = 'NativeAd';

// if tests didn't pass check placementId
const placementId = '629712900716487_629713604049750';
const adsManager = new NativeAdsManager(placementId);

const variables = [
  'advertiserName',
  'sponsoredTranslation',
  'headline',
  'socialContext',
  'bodyText',
  'callToActionText',
];

const FullNativeAd = withNativeAd(({ nativeAd }) => (
  <View>
    <View>
      <AdIconView />
      <View>
        <TriggerableView>
          {nativeAd.advertiserName && <Text>{nativeAd.advertiserName}</Text>}
          {nativeAd.sponsoredTranslation && <Text>{nativeAd.sponsoredTranslation}</Text>}
          {nativeAd.headline && <Text>{nativeAd.headline}</Text>}
        </TriggerableView>
      </View>
    </View>

    <View>
      <MediaView />
    </View>

    <View>
      <View>
        {nativeAd.socialContext && <Text>{nativeAd.socialContext}</Text>}
        {nativeAd.bodyText && <Text>{nativeAd.bodyText}</Text>}
      </View>

      <View>
        <TriggerableView>
          <Text>{nativeAd.callToActionText}</Text>
        </TriggerableView>
      </View>
    </View>
  </View>
));

export function test(t, { setPortalChild, cleanupPortal }) {
  t.describe('FacebookAds.NativeAd', () => {
    let nativeAd;
    t.beforeAll(async () => {
      nativeAd = await mountAndWaitFor(<FullNativeAd adsManager={adsManager} />);
    });
    t.afterEach(async () => await cleanupPortal());

    const mountAndWaitFor = (child, propName = 'onAdLoaded') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    t.describe('when given a valid placementId', () => {
      t.it('nativeAd properly mounted', async () => {
        t.expect(nativeAd).not.toBeNull();
        t.expect(typeof nativeAd).toEqual('object');
      });

      variables.forEach(variable => {
        t.it(`checking if variable ${variable} is not null`, () => {
          let value = nativeAd[variable];
          t.expect(value).not.toBeNull();
        });
      });
    });
  });
}
