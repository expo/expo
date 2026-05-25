import type { ListProps } from './types';
/**
 * Android implementation of `List`.
 * Composes `LazyColumn` and wraps with `PullToRefreshBox` when `onRefresh` is provided.
 * The returned promise drives the refresh indicator's visibility.
 */
export declare function List({ children, onRefresh, testID }: ListProps): import("react/jsx-runtime").JSX.Element;
export * from './types';
//# sourceMappingURL=index.android.d.ts.map