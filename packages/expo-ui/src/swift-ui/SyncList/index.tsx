import { requireNativeView } from 'expo';
import { useLayoutEffect, useState, type ReactElement } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { createSyncListId, registerSyncListRenderer } from './renderer';

type NativeSyncListProps = {
  listId: string;
  itemCount: number;
  renderVersion: number;
  estimatedItemSize: number;
  showsFPS: boolean;
  style?: StyleProp<ViewStyle>;
};

const SyncListNativeView: React.ComponentType<NativeSyncListProps> =
  requireNativeView<NativeSyncListProps>('ExpoUI', 'SyncListView');

export interface SyncListProps {
  /**
   * The number of rows the list contains.
   */
  itemCount: number;

  /**
   * Returns the row to render at the given index.
   *
   * Every row is its own React root, so nothing from the surrounding tree reaches it. Context
   * providers, error boundaries and Suspense boundaries that wrap the list do not apply, and
   * `useContext` in a row reads the default value. Pass what a row needs through this function
   * instead, or render the providers inside the returned element. Changing this function refreshes
   * the visible rows. If you memoize it, include all row inputs in its dependencies.
   *
   * > **Note:** this runs on the UI thread while the native list holds the JavaScript runtime,
   * > so it must return quickly. A row is rendered when the list scrolls to it, not in advance.
   */
  renderItem: (index: number) => ReactElement;

  /**
   * The height assumed for rows that have not been rendered yet, in points. Rows replace it with
   * their measured height once the list reaches them, so the scroll extent is an estimate until
   * then. A value close to the real average keeps the scroll bar steady.
   * @default 120
   */
  estimatedItemSize?: number;

  /**
   * Displays native UI frame timing, including in release builds. This measures display-link
   * callbacks, not GPU presentation or JavaScript FPS, and adds a small measurement overhead.
   * @default false
   */
  showsFPS?: boolean;

  style?: StyleProp<ViewStyle>;
}

/**
 * An experimental list that renders its rows on the UI thread, at the moment `UICollectionView`
 * asks for them. The initial React render and mount are synchronous. SwiftUI intrinsic sizing and
 * other later content changes can require a subsequent layout correction, so rows may briefly
 * overlap on initial mount. Unrendered rows use estimated heights.
 *
 * Rows are recycled: scrolling reuses a row's React subtree for a new index rather than remounting
 * it, so a row's own state has to be reset when its index changes.
 *
 * > **Warning:** this is an experiment. Its API can change in any release.
 * @platform ios
 */
export function SyncList({
  itemCount,
  renderItem,
  estimatedItemSize = 120,
  showsFPS = false,
  style,
}: SyncListProps) {
  const [listId] = useState(createSyncListId);

  // A render-phase adjustment keeps the native version and renderer inputs in the same commit.
  // No extra effect-driven render is needed, and an abandoned render never publishes its callback.
  const [renderer, setRenderer] = useState({ renderItem, itemCount, version: 0 });
  let renderVersion = renderer.version;
  if (renderer.renderItem !== renderItem || renderer.itemCount !== itemCount) {
    renderVersion += 1;
    setRenderer({ renderItem, itemCount, version: renderVersion });
  }

  useLayoutEffect(
    () => registerSyncListRenderer(listId, renderItem, itemCount, renderVersion),
    [listId, renderItem, itemCount, renderVersion]
  );

  return (
    <SyncListNativeView
      listId={listId}
      itemCount={itemCount}
      renderVersion={renderVersion}
      estimatedItemSize={estimatedItemSize}
      showsFPS={showsFPS}
      style={style}
    />
  );
}
