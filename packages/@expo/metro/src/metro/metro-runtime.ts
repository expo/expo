import type EventEmitter from 'eventemitter3';
// @ts-expect-error
import { HMRClient as MetroHMRClient } from 'metro-runtime/src/modules/HMRClient';

// See: https://github.com/facebook/metro/blob/e1ec4c74075f946f2a39c8b790e1dcc90003ff85/packages/metro-runtime/src/modules/HMRClient.js#L49-L60
export type HMRConnectionEvent = 'open' | 'close' | 'connection-error';

// See: https://github.com/facebook/metro/blob/e1ec4c74075f946f2a39c8b790e1dcc90003ff85/packages/metro-runtime/src/modules/HMRClient.js#L61-L88
export type HMRMessageEvent =
  | 'bundle-registered'
  | 'update-start'
  | 'update'
  | 'update-done'
  | 'error';

type HMRClientType = new (url: string) => {
  close(): void;
  send(message: string): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  hasPendingUpdates(): boolean;
} & EventEmitter<HMRMessageEvent | HMRConnectionEvent>;

export const HMRClient = MetroHMRClient as HMRClientType;
