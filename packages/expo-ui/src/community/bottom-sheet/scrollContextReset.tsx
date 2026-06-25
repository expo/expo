import type { Context, ReactNode } from 'react';
import { ScrollView, VirtualizedList } from 'react-native';

const VirtualizedListContext = (VirtualizedList as unknown as { contextType?: Context<unknown> })
  .contextType;
const ScrollViewContext = (ScrollView as unknown as { Context?: Context<unknown> }).Context;

// When a virtualised list (RN Flatlist) is nested within another Flatlist,
// it renders a regular View as Scroll component https://github.com/react/react-native/blob/5c197fb303ed0d975482757fefb7ed38349601b6/packages/virtualized-lists/Lists/VirtualizedList.js#L1291
// which breaks scrolling.
// Nested same direction FlatLists are generally considered bad
// but the react context check it is doing to identify nesting can break some genuine cases
// e.g. User has a FlatList with a button child that opens bottomsheet with a Flatlist.
// RN Modal uses similar pattern as below
export function SheetScrollContextReset({ children }: { children: ReactNode }) {
  let node: ReactNode = children;
  if (ScrollViewContext) {
    node = <ScrollViewContext.Provider value={null}>{node}</ScrollViewContext.Provider>;
  }
  if (VirtualizedListContext) {
    node = <VirtualizedListContext.Provider value={null}>{node}</VirtualizedListContext.Provider>;
  }
  return <>{node}</>;
}
