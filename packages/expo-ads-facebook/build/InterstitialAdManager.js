import { NativeModulesProxy } from '@unimodules/core';
const { CTKInterstitialAdManager = {
    async showAd() {
        return false;
    },
}, } = NativeModulesProxy;
export default {
    /**
     * Shows interstitial ad for a given placementId
     */
    async showAd(placementId) {
        return await CTKInterstitialAdManager.showAd(placementId);
    },
};
//# sourceMappingURL=InterstitialAdManager.js.map