import { UnavailabilityError } from 'expo-errors';

function unavailable(name: string) {
  throw new UnavailabilityError('FacebookAds', name);
}

export const withNativeAd = function() {
  unavailable('withNativeAd');
};
export const AdMediaView = function() {
  unavailable('AdMediaView');
};
export const AdIconView = function() {
  unavailable('AdIconView');
};
export const AdTriggerView = function() {
  unavailable('AdTriggerView');
};
export const AdSettings = function() {
  unavailable('AdSettings');
};
export const NativeAdsManager = function() {
  unavailable('NativeAdsManager');
};
export const InterstitialAdManager = function() {
  unavailable('InterstitialAdManager');
};
export const BannerAd = function() {
  unavailable('BannerAd');
};
