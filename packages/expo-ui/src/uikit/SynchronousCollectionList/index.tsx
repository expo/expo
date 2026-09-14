import { requireNativeView } from 'expo';
import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { registerSynchronousCollectionRenderer } from './registerSynchronousCollectionRenderer';

export interface SynchronousCollectionListRenderItemInfo<ItemT> {
  item: ItemT;
  index: number;
}

export interface SynchronousCollectionListProps<ItemT> {
  /** Items to display. Use a dense array without undefined entries; replace it when updating. */
  data: readonly ItemT[];
  /** Called lazily when native requests a row. Rows are independent React roots. */
  renderItem: (info: SynchronousCollectionListRenderItemInfo<ItemT>) => React.ReactElement;
  /** Change this to refresh rows when renderItem depends on values outside data. */
  extraData?: unknown;
  style?: StyleProp<ViewStyle>;
}

type NativeProps = {
  rendererId: string;
  itemCount: number;
  revision: number;
  style?: StyleProp<ViewStyle>;
};
const NativeList = requireNativeView<NativeProps>('ExpoUI', 'SynchronousCollectionListView');

/**
 * Experimental synchronous UIKit collection list. Set its size with the style prop.
 * Uses reusable self-sizing UICollectionView cells.
 * Native identities are indices. Parent React context isn't inherited by row roots.
 * Row components are recycled: reset local state when the item/index changes, and
 * update or clean up item-specific subscriptions and async work yourself.
 */
export function SynchronousCollectionList<ItemT>({
  data,
  renderItem,
  extraData,
  style,
}: SynchronousCollectionListProps<ItemT>) {
  const [nativeProps, setNativeProps] = React.useState<NativeProps | null>(null);
  const registration = React.useRef<ReturnType<
    typeof registerSynchronousCollectionRenderer
  > | null>(null);

  React.useLayoutEffect(() => {
    const render = (index: number) => {
      const item = data[index];
      if (item === undefined) {
        throw new Error(
          `SynchronousCollectionList received a request for a missing item at index ${index}`
        );
      }
      return renderItem({ item, index });
    };
    if (!registration.current) {
      registration.current = registerSynchronousCollectionRenderer(render);
    } else {
      registration.current.update(render);
    }
    const rendererId = registration.current.rendererId;
    setNativeProps((previous) => ({
      rendererId,
      itemCount: data.length,
      revision: (previous?.revision ?? -1) + 1,
    }));
  }, [data, renderItem, extraData]);

  React.useEffect(
    () => () => {
      registration.current?.dispose();
      registration.current = null;
    },
    []
  );

  return nativeProps ? <NativeList {...nativeProps} style={style} /> : null;
}
