import { ListForEach as SwiftUIListForEach } from '../../swift-ui/List/ListForEach';
import type { ListForEachProps } from './types';

/**
 * iOS implementation of `List.ForEach`. Delegates to SwiftUI `List.ForEach`.
 */
export function ListForEach<T>(props: ListForEachProps<T>) {
  return <SwiftUIListForEach {...props} />;
}
