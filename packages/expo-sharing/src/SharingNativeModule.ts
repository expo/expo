import { requireNativeModule } from 'expo';

import type { SharingOptions, ResolvedSharePayload, SharePayload } from './Sharing.types';

type SharingModule = {
  shareAsync(url: string, options: SharingOptions): Promise<void>;
  getSharedPayloads(): SharePayload[];
  getResolvedSharedPayloadsAsync(): Promise<ResolvedSharePayload[]>;
  clearSharedPayloads(): void;
  isAvailableAsync(): Promise<boolean>;
};

export default requireNativeModule<SharingModule>('ExpoSharing');
