'use strict';

import * as FacebookAds from 'expo-ads-facebook';
import React from 'react';
import { View, Text } from 'react-native';

import { mountAndWaitFor as originalMountAndWaitFor } from './helpers';

const {
  NativeAdsManager,
  AdSettings,
  withNativeAd,
  AdMediaView,
  AdIconView,
  AdTriggerView,
} = FacebookAds;

try {
  AdSettings.addTestDevice(AdSettings.currentDeviceHash);
} catch (e) {
  // AdSettings may not be available, shrug
}

export const name = 'NativeAd';

// if tests didn't pass check placementId
const placementId = '629712900716487_629713604049750';

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
        <AdTriggerView>
          {nativeAd.advertiserName ? <Text>{nativeAd.advertiserName}</Text> : null}
          {nativeAd.sponsoredTranslation ? <Text>{nativeAd.sponsoredTranslation}</Text> : null}
          {nativeAd.headline ? <Text>{nativeAd.headline}</Text> : null}
        </AdTriggerView>
      </View>
    </View>

    <View>
      <AdMediaView />
    </View>

    <View>
      <View>
        {nativeAd.socialContext && <Text>{nativeAd.socialContext}</Text>}
        {nativeAd.bodyText && <Text>{nativeAd.bodyText}</Text>}
      </View>

      <View>
        <AdTriggerView>
          <Text>{nativeAd.callToActionText}</Text>
        </AdTriggerView>
      </View>
    </View>
  </View>
));

export function test(t, { setPortalChild, cleanupPortal }) {
  t.describe('FacebookAds.NativeAd', () => {
    const mountAndWaitFor = (child, propName = 'onAdLoaded') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    t.afterEach(async () => await cleanupPortal());

    t.describe('when given a valid placementId', () => {
      let nativeAd;

      t.it(
        'nativeAd properly mounted',
        async () => {
          nativeAd = await mountAndWaitFor(
            <FullNativeAd adsManager={new NativeAdsManager(placementId)} />
          );
          t.expect(nativeAd).not.toBeNull();
          t.expect(typeof nativeAd).toEqual('object');
        },
        30000
      );

      variables.forEach(variable => {
        t.it(`checking if variable ${variable} is not null`, () => {
          let value = nativeAd[variable];
          t.expect(value).not.toBeNull();
        });
      });
    });
  });
}
