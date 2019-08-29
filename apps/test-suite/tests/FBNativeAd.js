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

AdSettings.addTestDevice(AdSettings.currentDeviceHash);

export function canRunAsync({ isAutomated }) {
  // Invalid placementId in CI (all tests fail)
  return !isAutomated;
}

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
        <AdTriggerView>
          {nativeAd.advertiserName && <Text>{nativeAd.advertiserName}</Text>}
          {nativeAd.sponsoredTranslation && <Text>{nativeAd.sponsoredTranslation}</Text>}
          {nativeAd.headline && <Text>{nativeAd.headline}</Text>}
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

export function test(
  { describe, afterEach, it, expect, jasmine, ...t },
  { setPortalChild, cleanupPortal }
) {
  describe('FacebookAds.NativeAd', () => {
    let nativeAd;
    t.beforeAll(async () => {
      nativeAd = await mountAndWaitFor(<FullNativeAd adsManager={adsManager} />);
    });
    afterEach(async () => await cleanupPortal());

    const mountAndWaitFor = (child, propName = 'onAdLoaded') =>
      originalMountAndWaitFor(child, propName, setPortalChild);

    describe('when given a valid placementId', () => {
      it('nativeAd properly mounted', async () => {
        expect(nativeAd).not.toBeNull();
        expect(typeof nativeAd).toEqual('object');
      });

      variables.forEach(variable => {
        it(`checking if variable ${variable} is not null`, () => {
          let value = nativeAd[variable];
          expect(value).not.toBeNull();
        });
      });
    });
  });
}
