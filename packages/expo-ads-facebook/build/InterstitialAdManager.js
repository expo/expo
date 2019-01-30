import { NativeModulesProxy } from 'expo-core';
const { CTKInterstitialAdManager } = NativeModulesProxy;
export default {
    /**
     * Shows interstitial ad for a given placementId
     */
    showAd(placementId) {
        return CTKInterstitialAdManager.showAd(placementId);
    },
};
//# sourceMappingURL=InterstitialAdManager.js.map