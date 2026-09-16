import type * as React from 'react';
import ReactFabric from 'react-native/Libraries/Renderer/shims/ReactFabric';

export type SyncListItemRenderer = (index: number) => React.ReactElement;

/**
 * The renderers of every mounted `SyncList`, keyed by the `listId` prop the
 * native view was given. The native list passes that id back so two lists on
 * the same screen render their own rows.
 */
const renderers = new Map<
  string,
  { renderItem: SyncListItemRenderer; itemCount: number; version: number }
>();

let nextListId = 0;

export function createSyncListId(): string {
  nextListId += 1;
  return `expo-ui-sync-list-${nextListId}`;
}

export function registerSyncListRenderer(
  listId: string,
  renderItem: SyncListItemRenderer,
  itemCount: number,
  version: number
): () => void {
  const renderer = { renderItem, itemCount, version };
  renderers.set(listId, renderer);
  return () => {
    if (renderers.get(listId) === renderer) {
      renderers.delete(listId);
    }
  };
}

/**
 * Renders one row into a cell's Fabric surface. The native list calls this while it owns
 * the runtime on the UI thread, so everything it does has to finish before it returns.
 *
 * Returns null when the native request belongs to a retired renderer/version. This is expected
 * while an update or unmount is waiting to reach UIKit. False indicates a live render failed
 * to commit synchronously; it must not be confused with normal retirement.
 */
export function renderSyncListCell(
  listId: string,
  surfaceId: number,
  index: number,
  version: number
): boolean | null {
  const renderer = renderers.get(listId);
  if (!renderer || renderer.version !== version || index < 0 || index >= renderer.itemCount) {
    return null;
  }
  let committed = false;
  // `concurrentRoot: false` selects the legacy root, which cannot yield: by the time
  // `render` returns, React has committed and the callback has already run.
  ReactFabric.render(renderer.renderItem(index), surfaceId, () => (committed = true), false, null);
  return committed;
}

export function unmountSyncListCell(surfaceId: number): void {
  ReactFabric.unmountComponentAtNode(surfaceId);
}

// The two names `ExpoUISyncListView.mm` looks up on the runtime's global object.
declare global {
  // eslint-disable-next-line no-var
  var __ExpoUISyncListRender: typeof renderSyncListCell;
  // eslint-disable-next-line no-var
  var __ExpoUISyncListUnmount: typeof unmountSyncListCell;
}

globalThis.__ExpoUISyncListRender = renderSyncListCell;
globalThis.__ExpoUISyncListUnmount = unmountSyncListCell;
