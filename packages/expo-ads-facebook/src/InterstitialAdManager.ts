import { NativeModulesProxy } from '@unimodules/core';

const {
  CTKInterstitialAdManager = {
    async showAd() {
      return false;
    },
  },
} = NativeModulesProxy;

export default {
  /**
   * Shows interstitial ad for a given placementId
   */
  async showAd(placementId: string): Promise<boolean> {
    return await CTKInterstitialAdManager.showAd(placementId);
  },
};
