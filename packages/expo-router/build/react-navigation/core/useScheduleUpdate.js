"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScheduleUpdate = useScheduleUpdate;
const react_1 = require("react");
const NavigationBuilderContext_1 = require("./NavigationBuilderContext");
const useClientLayoutEffect_1 = require("./useClientLayoutEffect");
/**
 * When screen config changes, we want to update the navigator in the same update phase.
 * However, navigation state is in the root component and React won't let us update it from a child.
 * This is a workaround for that, the scheduled update is stored in the ref without actually calling setState.
 * It lets all subsequent updates access the latest state so it stays correct.
 * Then we call setState during after the component updates.
 */
function useScheduleUpdate(callback) {
    const { scheduleUpdate, flushUpdates } = (0, react_1.use)(NavigationBuilderContext_1.NavigationBuilderContext);
    // The callback is buffered during render and run in a layout effect via `flushUpdates`, which
    // wraps it in the navigation store's `batch` so all scheduled writes in this commit coalesce into
    // a single committed tree. (Previously this relied on the now-removed `useSyncState` batchUpdates.)
    scheduleUpdate(callback);
    (0, useClientLayoutEffect_1.useClientLayoutEffect)(flushUpdates);
}
//# sourceMappingURL=useScheduleUpdate.js.map