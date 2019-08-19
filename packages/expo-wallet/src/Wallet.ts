import { UnavailabilityError, EventEmitter, Subscription, Platform } from '@unimodules/core';

import { PassViewFinishListener } from './Wallet.types';
import ExpoWallet from './ExpoWallet';
import AddPassButton from './AddPassButton';

const WalletEventEmitter = new EventEmitter(ExpoWallet);

export async function canAddPassesAsync(): Promise<boolean> {
  if (!ExpoWallet.canAddPassesAsync) {
    return false;
  }
  return await ExpoWallet.canAddPassesAsync();
}

export async function addPassFromUrlAsync(url): Promise<boolean> {
  if (!ExpoWallet.addPassFromUrlAsync) {
    throw new UnavailabilityError('expo-wallet', 'addPassFromUrlAsync');
  }
  return await ExpoWallet.addPassFromUrlAsync(url);
}

export function addPassViewDidFinishListener(listener: PassViewFinishListener): Subscription {
  if (Platform.OS !== 'ios') {
    throw new UnavailabilityError('expo-wallet', 'addPassViewDidFinishListener');
  }
  return WalletEventEmitter.addListener('Expo.addPassesViewControllerDidFinish', listener);
}

export { PassViewFinishListener, AddPassButton };
