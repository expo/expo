import { UnavailabilityError, EventEmitter, Subscription, Platform } from '@unimodules/core';

import { PassViewFinishListener } from './Wallet.types';
import ExpoWallet from './ExpoWallet';

const WalletEventEmitter = new EventEmitter(ExpoWallet);

export async function canAddPassesAsync(): Promise<boolean> {
  if (!ExpoWallet.canAddPassesAsync) {
    throw new UnavailabilityError('expo-wallet', 'canAddPassesAsync');
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
  if(Platform.OS === 'ios'){
    return WalletEventEmitter.addListener('Expo.addPassesViewControllerDidFinish', listener);
  }
  throw new UnavailabilityError('expo-wallet', 'addPassViewDidFinishListener');
}

export {
  PassViewFinishListener
}