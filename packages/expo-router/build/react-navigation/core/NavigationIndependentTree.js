"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationIndependentTree = NavigationIndependentTree;
const jsx_runtime_1 = require("react/jsx-runtime");
const NavigationContext_1 = require("./NavigationContext");
const NavigationIndependentTreeContext_1 = require("./NavigationIndependentTreeContext");
const NavigationProvider_1 = require("./NavigationProvider");
const useIsFocused_1 = require("./useIsFocused");
/**
 * Component to make the child navigation container independent of parent containers.
 */
function NavigationIndependentTree({ children }) {
    return ((0, jsx_runtime_1.jsx)(NavigationProvider_1.NavigationRouteContext.Provider, { value: undefined, children: (0, jsx_runtime_1.jsx)(NavigationContext_1.NavigationContext.Provider, { value: undefined, children: (0, jsx_runtime_1.jsx)(useIsFocused_1.IsFocusedContext.Provider, { value: undefined, children: (0, jsx_runtime_1.jsx)(NavigationIndependentTreeContext_1.NavigationIndependentTreeContext.Provider, { value: true, children: children }) }) }) }));
}
//# sourceMappingURL=NavigationIndependentTree.js.map