export default {
  get name(): string {
    return 'ExpoAdsAdMobInterstitialManager';
  },
  async getIsReady(): Promise<boolean> {
    return false;
  },
};
