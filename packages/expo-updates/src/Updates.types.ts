import Constants from 'expo-constants';

export enum UpdateEventType {
  UPDATE_AVAILABLE = 'updateAvailable',
  NO_UPDATE_AVAILABLE = 'noUpdateAvailable',
  ERROR = 'error',
}

// TODO(eric): move source of truth for manifest type to this module
export type Manifest = typeof Constants.manifest;

export type UpdateCheckResult = { isAvailable: false } | { isAvailable: true; manifest: Manifest };

export type UpdateFetchResult = { isNew: false } | { isNew: true; manifest: Manifest };

export type Listener<E> = (event: E) => void;

export type UpdateEvent =
  | { type: UpdateEventType.NO_UPDATE_AVAILABLE }
  | { type: UpdateEventType.UPDATE_AVAILABLE; manifest: Manifest }
  | { type: UpdateEventType.ERROR; message: string };

export type LocalAssets = { [remoteUrl: string]: string };
