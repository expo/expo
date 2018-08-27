module.exports = {
  get AdMobBanner() {
    return require('./src/AdMobBanner').default;
  },
  get AdMobInterstitial() {
    return require('./src/AdMobInterstitial');
  },
  get AdMobRewarded() {
    return require('./src/AdMobRewarded');
  },
  get PublisherBanner() {
    return require('./src/PublisherBanner').default;
  },
};