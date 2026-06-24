import type { ComponentType, Context, ReactNode } from 'react';
import { Modal, ScrollView } from 'react-native';

const VirtualizedListContextResetter = (
  Modal as unknown as { Context?: ComponentType<{ children: ReactNode }> }
).Context;
const ScrollViewContext = (
  ScrollView as unknown as { Context: Context<{ horizontal: boolean } | null> }
).Context;

// When virtualised list (RN Flatlist) is nested within another Flatlist,
// it renders a regular View as Scroll component https://github.com/react/react-native/blob/5c197fb303ed0d975482757fefb7ed38349601b6/packages/virtualized-lists/Lists/VirtualizedList.js#L1291
// which breaks scrolling.
// Nested same direction FlatLists are generally considered bad
// but the react context check it is doing to identify nesting can break some genuine cases
// e.g. User has a FlatList with a button child that opens bottomsheet with a Flatlist
export function SheetScrollContextReset({ children }: { children: ReactNode }) {
  const content = <ScrollViewContext.Provider value={null}>{children}</ScrollViewContext.Provider>;
  return VirtualizedListContextResetter ? (
    <VirtualizedListContextResetter>{content}</VirtualizedListContextResetter>
  ) : (
    content
  );
}
