import { LazyColumn, PullToRefreshBox } from '@expo/ui/jetpack-compose';
import { testID as testIDModifier, type ModifierConfig } from '@expo/ui/jetpack-compose/modifiers';
import { useCallback, useState } from 'react';

import { EnsureHost, fullHostOptions } from '../autoHost';
import type { ListProps } from './types';

/**
 * Android implementation of `List`.
 * Composes `LazyColumn` and wraps with `PullToRefreshBox` when `onRefresh` is provided.
 * The returned promise drives the refresh indicator's visibility.
 */
export function List({ children, onRefresh, testID }: ListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const listModifiers: ModifierConfig[] | undefined = testID ? [testIDModifier(testID)] : undefined;
  const listContent = <LazyColumn modifiers={listModifiers}>{children}</LazyColumn>;

  if (!onRefresh) {
    return <EnsureHost {...fullHostOptions()}>{listContent}</EnsureHost>;
  }

  return (
    <EnsureHost {...fullHostOptions()}>
      {/* `contentAlignment="topCenter"` keeps the refresh indicator centered.
          The indicator's own `Modifier.align` resolves outside `BoxScope` and becomes a no-op, so we set it on the parent. */}
      <PullToRefreshBox
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentAlignment="topCenter">
        {listContent}
      </PullToRefreshBox>
    </EnsureHost>
  );
}

export * from './types';
