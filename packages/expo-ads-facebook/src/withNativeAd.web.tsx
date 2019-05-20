import { UnavailabilityError } from '@unimodules/core';

export default function withNativeAd() {
  throw new UnavailabilityError('expo-ads-facebook', 'withNativeAd');
}
