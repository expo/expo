import { ListForEach as SwiftUIListForEach } from '../../swift-ui/List/ListForEach';
import type { ListForEachProps } from './types';

/**
 * iOS implementation of `List.ForEach`. Delegates to SwiftUI `List.ForEach`.
 */
export function ListForEach<T>({
  data,
  keyExtractor,
  children,
  recycling,
  overscanCount,
  estimatedItemSize,
}: ListForEachProps<T>) {
  return (
    <SwiftUIListForEach
      data={data}
      keyExtractor={keyExtractor}
      recycling={recycling}
      overscanCount={overscanCount}
      estimatedItemSize={estimatedItemSize}>
      {children}
    </SwiftUIListForEach>
  );
}
