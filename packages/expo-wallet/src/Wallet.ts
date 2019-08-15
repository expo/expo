import { Platform, UnavailabilityError } from '@unimodules/core';

import ExpoWallet from './ExpoWallet';

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

export async function addPassFromFilePathAsync(filePath): Promise<boolean> {
  if (!ExpoWallet.addPassFromFilePathAsync) {
    throw new UnavailabilityError('expo-wallet', 'addPassFromFilePathAsync');
  }
  return await ExpoWallet.addPassFromFilePathAsync(filePath);
}