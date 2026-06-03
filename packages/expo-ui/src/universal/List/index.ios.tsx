import { List as SwiftUIList } from '@expo/ui/swift-ui';
import { refreshable, type ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import { EnsureHost, fullHostOptions } from '../autoHost';
import type { ListProps } from './types';

/**
 * iOS implementation of `List`.
 * Delegates to SwiftUI's `List` and applies `.refreshable` when `onRefresh` is provided.
 */
export function List({ children, onRefresh, testID }: ListProps) {
  const modifiers: ModifierConfig[] | undefined = onRefresh ? [refreshable(onRefresh)] : undefined;
  return (
    <EnsureHost {...fullHostOptions()}>
      <SwiftUIList modifiers={modifiers} testID={testID}>
        {children}
      </SwiftUIList>
    </EnsureHost>
  );
}

export * from './types';
