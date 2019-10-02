export default {
  get name(): string {
    return 'ExpoAdsAdMobRewardedVideoAdManager';
  },
  async getIsReady(): Promise<boolean> {
    return false;
  },
};
