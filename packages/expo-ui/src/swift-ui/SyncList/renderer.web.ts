import type * as React from 'react';

// Keeps the `react-native/Libraries/Renderer/shims/ReactFabric` import in `renderer.ts` out of the
// web graph. Metro aliases `react-native` to `react-native-web` there, which has no such module, so
// the bundle would fail to resolve rather than reach the error `requireNativeView` already throws.
export type SyncListItemRenderer = (index: number) => React.ReactElement;

export function createSyncListId(): string {
  return 'expo-ui-sync-list-web';
}

export function registerSyncListRenderer(
  listId: string,
  renderItem: SyncListItemRenderer,
  itemCount: number,
  version: number
): () => void {
  return () => {};
}
