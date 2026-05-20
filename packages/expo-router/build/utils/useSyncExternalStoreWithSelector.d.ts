/**
 * A replacement for the `use-sync-external-store/with-selector` shim,
 * built on React 19's native `useSyncExternalStore`.
 *
 * Based on the original React implementation. Supports selector memoization
 * and an optional `isEqual` comparator for custom equality checks.
 */
export declare function useSyncExternalStoreWithSelector<Snapshot, Selection>(subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => Snapshot, getServerSnapshot: undefined | null | (() => Snapshot), selector: (snapshot: Snapshot) => Selection, isEqual?: (a: Selection, b: Selection) => boolean): Selection;
//# sourceMappingURL=useSyncExternalStoreWithSelector.d.ts.map