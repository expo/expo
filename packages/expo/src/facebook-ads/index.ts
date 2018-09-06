export default {
  get withNativeAd() {
    return require('./withNativeAd').default;
  },
  get AdMediaView() {
    return require('./AdMediaView').default;
  },
  get AdIconView() {
    return require('./AdIconView').default;
  },
  get AdTriggerView() {
    return require('./AdTriggerView').default;
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
    return require('./BannerAd').default;
  },

  // DEPRECATED since SDK 31
  get MediaView() {
    console.warn(
      `MediaView has been renamed to AdMediaView and will be removed in SDK 33; update the import in your code`
    );
    return require('./AdMediaView').default;
  },
  get TriggerableView() {
    console.warn(
      `TriggerableView has been renamed to AdTriggerView and will be removed in SDK 33; update the import in your code`
    );
    return require('./AdTriggerView').default;
  },
};
