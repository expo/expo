import type { EventSubscription } from 'expo';

import type {
  GranularPermission,
  MediaLibraryAssetsChangeEvent,
  MediaTypeFilter,
  PermissionResponse,
} from '../types';
import * as MediaLibrary from './MediaLibrary';

/**
 * @deprecated Use `MediaLibrary.requestPermissions()` instead.
 */
export async function requestPermissionsAsync(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
  return MediaLibrary.requestPermissions(writeOnly, granularPermissions);
}

/**
 * @deprecated Use `MediaLibrary.getPermissions()` instead.
 */
export async function getPermissionsAsync(
  writeOnly: boolean = false,
  granularPermissions?: GranularPermission[]
): Promise<PermissionResponse> {
  return MediaLibrary.getPermissions(writeOnly, granularPermissions);
}

/**
 * @deprecated Use `presentPermissionsPicker()` from the `MediaLibrary` export instead: `import { MediaLibrary } from 'expo-media-library'`.
 */
export async function presentPermissionsPicker(mediaTypes?: MediaTypeFilter[]): Promise<void> {
  return MediaLibrary.presentPermissionsPicker(mediaTypes);
}

/**
 * @deprecated Use `addListener()` from the `MediaLibrary` export instead: `import { MediaLibrary } from 'expo-media-library'`.
 */
export function addListener(
  listener: (event: MediaLibraryAssetsChangeEvent) => void
): EventSubscription {
  return MediaLibrary.addListener(listener);
}

/**
 * @deprecated Use `removeAllListeners()` from the `MediaLibrary` export instead: `import { MediaLibrary } from 'expo-media-library'`.
 */
export function removeAllListeners(): void {
  MediaLibrary.removeAllListeners();
}
