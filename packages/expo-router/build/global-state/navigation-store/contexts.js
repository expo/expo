"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationStoreContext = exports.RootTreeContext = void 0;
const react_1 = require("react");
/**
 * The committed navigation tree, flowed down by plain React context (no `useSyncExternalStore`).
 * Consumers read it with `use(RootTreeContext)`; route info / per-navigator slices derive from it.
 */
exports.RootTreeContext = (0, react_1.createContext)(undefined);
/**
 * The producer-side staging buffer. The navigation container owns it and re-publishes its committed
 * tree via {@link RootTreeContext}; the imperative drain reaches it via the module singleton.
 */
exports.NavigationStoreContext = (0, react_1.createContext)(null);
//# sourceMappingURL=contexts.js.map