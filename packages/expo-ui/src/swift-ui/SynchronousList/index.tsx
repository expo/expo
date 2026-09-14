import { requireNativeView } from 'expo';
import * as React from 'react';

import { registerSynchronousCellRenderer } from './registerSynchronousCellRenderer';

export interface SynchronousListRenderItemInfo<ItemT> {
  item: ItemT;
  index: number;
}

export interface SynchronousListProps<ItemT> {
  /** Items to display. Use a dense array without undefined entries; replace it when updating. */
  data: readonly ItemT[];
  /** Called lazily when native requests a row. Rows are independent React roots. */
  renderItem: (info: SynchronousListRenderItemInfo<ItemT>) => React.ReactElement;
  /** Change this to refresh rows when renderItem depends on values outside data. */
  extraData?: unknown;
}

type NativeProps = { rendererId: string; itemCount: number; revision: number };
const NativeList = requireNativeView<NativeProps>('ExpoUI', 'SynchronousListView');

/**
 * Experimental synchronous SwiftUI List. Place inside Host without an enclosing List.
 * Uses default native styling, no explicit sections, and no injected modifiers.
 * Native identities are indices. Parent React context isn't inherited by row roots.
 * Row components are recycled: reset local state when the item/index changes, and
 * update or clean up item-specific subscriptions and async work yourself.
 */
export function SynchronousList<ItemT>({
  data,
  renderItem,
  extraData,
}: SynchronousListProps<ItemT>) {
  const [nativeProps, setNativeProps] = React.useState<NativeProps | null>(null);
  const registration = React.useRef<ReturnType<typeof registerSynchronousCellRenderer> | null>(
    null
  );

  React.useLayoutEffect(() => {
    const render = (index: number) => {
      const item = data[index];
      if (item === undefined) {
        throw new Error(`SynchronousList received a request for a missing item at index ${index}`);
      }
      return renderItem({ item, index });
    };
    if (!registration.current) {
      registration.current = registerSynchronousCellRenderer(render);
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

  return nativeProps ? <NativeList {...nativeProps} /> : null;
}
