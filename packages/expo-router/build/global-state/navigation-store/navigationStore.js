"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNavigationStore = createNavigationStore;
exports.setRootNavigationStore = setRootNavigationStore;
exports.getRootNavigationStore = getRootNavigationStore;
const navReducer_1 = require("./navReducer");
const replaceSliceByKey_1 = require("./replaceSliceByKey");
const deepFreeze_1 = require("../../react-navigation/core/deepFreeze");
function createNavigationStore(initialTree) {
    const liveTreeRef = { current: (0, deepFreeze_1.deepFreeze)(initialTree) };
    let dispatch = null;
    // Pending work for the next flush. `pendingRoot` (imperative) takes precedence over
    // `pendingSlices` (render-phase) because a staged root tree already subsumes any slice writes.
    let pendingRoot = null;
    let pendingSlices = [];
    let isBatching = false;
    let isFlushing = false;
    const flush = () => {
        if (isFlushing) {
            // A dispatched render that synchronously stages + flushes again must not re-enter mid-flush.
            return;
        }
        if (!dispatch) {
            // No reducer wired yet (pre-mount) or after unmount. Keep the pending work buffered — the live
            // tree already holds the result and seeds the reducer on mount; a later flush (once a dispatch
            // is wired) still publishes it, so it is not silently dropped.
            return;
        }
        const root = pendingRoot;
        const slices = pendingSlices;
        if (root === null && slices.length === 0) {
            return;
        }
        pendingRoot = null;
        pendingSlices = [];
        isFlushing = true;
        try {
            if (root !== null) {
                dispatch((0, navReducer_1.replaceRoot)(root));
            }
            else {
                dispatch((0, navReducer_1.commitSlices)(slices));
            }
        }
        finally {
            isFlushing = false;
        }
    };
    return {
        getState() {
            return liveTreeRef.current;
        },
        stageRootState(tree) {
            if (process.env.NODE_ENV !== 'production' && pendingSlices.length > 0) {
                console.warn(`[expo-router] A staged root navigation state superseded ${pendingSlices.length} ` +
                    `pending slice commit(s). The root must be derived from the latest getState() so those ` +
                    `writes are not lost.`);
            }
            liveTreeRef.current = (0, deepFreeze_1.deepFreeze)(tree);
            pendingRoot = tree;
            pendingSlices = [];
            if (!isBatching) {
                flush();
            }
        },
        commitSlice(key, slice) {
            // Update the live tree synchronously so a sibling committing later in the same batch reads it.
            const next = (0, replaceSliceByKey_1.replaceSliceByKey)(liveTreeRef.current, key, (0, deepFreeze_1.deepFreeze)(slice));
            if (next === liveTreeRef.current) {
                // Unknown key (e.g. a not-yet-mounted lazy navigator) — nothing changed, nothing to commit.
                return;
            }
            liveTreeRef.current = next;
            pendingSlices.push({ key, slice });
            if (!isBatching) {
                flush();
            }
        },
        batch(callback) {
            const wasBatching = isBatching;
            isBatching = true;
            try {
                callback();
            }
            finally {
                isBatching = wasBatching;
            }
            if (!isBatching) {
                flush();
            }
        },
        flush,
        setDispatch(next) {
            dispatch = next;
        },
    };
}
// The root store is a module singleton (matching `routingQueue` / `store`) so the imperative drain
// effect — which lives above the navigation container and cannot read its context — can batch and
// flush through it. Reset on each container mount.
let rootStore = null;
function setRootNavigationStore(store) {
    rootStore = store;
}
function getRootNavigationStore() {
    return rootStore;
}
//# sourceMappingURL=navigationStore.js.map