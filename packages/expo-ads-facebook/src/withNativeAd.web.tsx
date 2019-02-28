import { UnavailabilityError } from 'expo-errors';

export default function withNativeAd() {
  throw new UnavailabilityError('expo-ads-facebook', 'withNativeAd');
}
