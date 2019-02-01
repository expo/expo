import { NativeModulesProxy } from 'expo-core';

const { CTKInterstitialAdManager } = NativeModulesProxy;

export default {
  /**
   * Shows interstitial ad for a given placementId
   */
  showAd(placementId: string): Promise<boolean> {
    return CTKInterstitialAdManager.showAd(placementId);
  },
};
