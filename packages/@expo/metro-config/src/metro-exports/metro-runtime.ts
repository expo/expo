// @ts-expect-error - No types available for `metro-runtime`
import { HMRClient as MetroHMRClient } from 'metro-runtime/src/modules/HMRClient';

import type { EventEmitter } from './eventemitter3';

// See: https://github.com/facebook/metro/blob/e1ec4c74075f946f2a39c8b790e1dcc90003ff85/packages/metro-runtime/src/modules/HMRClient.js#L49-L60
export type HMRConnectionEvent = 'open' | 'close' | 'connection-error';

// See: https://github.com/facebook/metro/blob/e1ec4c74075f946f2a39c8b790e1dcc90003ff85/packages/metro-runtime/src/modules/HMRClient.js#L61-L88
export type HMRMessageEvent =
  | 'bundle-registered'
  | 'update-start'
  | 'update'
  | 'update-done'
  | 'error';

interface HMRClientStatic {
  new (url: string): HMRClientInstance;
}

interface HMRClientInstance extends EventEmitter<HMRMessageEvent | HMRConnectionEvent> {
  close(): void;
  send(message: string): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  hasPendingUpdates(): boolean;
}

export const HMRClient: HMRClientStatic = MetroHMRClient;
