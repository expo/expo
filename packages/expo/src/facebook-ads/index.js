// @flow

module.exports = {
  get withNativeAd() {
    return require('./withNativeAd').default;
  },
  get AdSettings() {
    return require('./AdSettings').default;
  },
  get NativeAdsManager() {
    return require('./NativeAdsManager').default;
  },
  get InterstitialAdManager() {
    return require('./InterstitialAdManager').default;
  },
  get BannerView() {
    return require('./BannerViewManager').default;
  },
  get MediaView() {
    return require('./MediaViewManager').default;
  },
  get AdIconView() {
    return require('./AdIconViewManager').default;
  },
  get TriggerableView() {
    return require('./TriggerableView').default;
  },
};
