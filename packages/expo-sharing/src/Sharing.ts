import { UnavailabilityError } from '@unimodules/core';

import Sharing from './ExpoSharing';

type ShareOptions = {
  mimeType?: string;
  UTI?: string;
  dialogTitle?: string;
};

export async function isAvailableAsync(): Promise<boolean> {
  if (Sharing) {
    if (Sharing.isAvailableAsync) {
      return await Sharing.isAvailableAsync();
    }
    return true;
  }

  return false;
}

export async function shareAsync(url: string, options: ShareOptions = {}): Promise<{}> {
  if (!Sharing || !Sharing.shareAsync) {
    throw new UnavailabilityError('Sharing', 'shareAsync');
  }
  return await Sharing.shareAsync(url, options);
}
