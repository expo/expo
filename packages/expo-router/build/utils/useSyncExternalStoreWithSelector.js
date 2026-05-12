"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector;
const react_1 = require("react");
// Based on https://github.com/facebook/react/blob/4049cfeeab33146e02b0721477fd5f2020f76a04/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
/**
 * A replacement for the `use-sync-external-store/with-selector` shim,
 * built on React 19's native `useSyncExternalStore`.
 *
 * Based on the original React implementation. Supports selector memoization
 * and an optional `isEqual` comparator for custom equality checks.
 */
function useSyncExternalStoreWithSelector(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
    const instRef = (0, react_1.useRef)(null);
    let inst;
    if (instRef.current === null) {
        inst = {
            hasValue: false,
            value: null,
        };
        instRef.current = inst;
    }
    else {
        inst = instRef.current;
    }
    const [getSelection, getServerSelection] = (0, react_1.useMemo)(() => {
        // Track the memoized state using closure variables that are local to this
        // memoized instance of a getSnapshot function. Intentionally not using a
        // useRef hook, because that state would be shared across all concurrent
        // copies of the hook/component.
        let hasMemo = false;
        let memoizedSnapshot;
        let memoizedSelection;
        const memoizedSelector = (nextSnapshot) => {
            if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                const nextSelection = selector(nextSnapshot);
                if (isEqual !== undefined) {
                    if (inst.hasValue) {
                        const currentSelection = inst.value;
                        if (isEqual(currentSelection, nextSelection)) {
                            memoizedSelection = currentSelection;
                            return currentSelection;
                        }
                    }
                }
                memoizedSelection = nextSelection;
                return nextSelection;
            }
            const prevSnapshot = memoizedSnapshot;
            const prevSelection = memoizedSelection;
            if (Object.is(prevSnapshot, nextSnapshot)) {
                return prevSelection;
            }
            const nextSelection = selector(nextSnapshot);
            if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
                memoizedSnapshot = nextSnapshot;
                return prevSelection;
            }
            memoizedSnapshot = nextSnapshot;
            memoizedSelection = nextSelection;
            return nextSelection;
        };
        const getSnapshotWithSelector = () => memoizedSelector(getSnapshot());
        const getServerSnapshotWithSelector = getServerSnapshot == null ? undefined : () => memoizedSelector(getServerSnapshot());
        return [getSnapshotWithSelector, getServerSnapshotWithSelector];
    }, [getSnapshot, getServerSnapshot, selector, isEqual]);
    const value = (0, react_1.useSyncExternalStore)(subscribe, getSelection, getServerSelection);
    (0, react_1.useEffect)(() => {
        inst.hasValue = true;
        inst.value = value;
    }, [value]);
    (0, react_1.useDebugValue)(value);
    return value;
}
//# sourceMappingURL=useSyncExternalStoreWithSelector.js.map