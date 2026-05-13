"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarColorContext = exports.ToolbarPlacementContext = void 0;
exports.useToolbarPlacement = useToolbarPlacement;
exports.useToolbarColors = useToolbarColors;
const react_1 = require("react");
/**
 * Context to track which toolbar placement the current component is in.
 * This allows shared components (Button, Menu, Spacer, etc.) to behave
 * differently based on their placement.
 */
exports.ToolbarPlacementContext = (0, react_1.createContext)(null);
function useToolbarPlacement() {
    return (0, react_1.useContext)(exports.ToolbarPlacementContext);
}
/**
 * Context for toolbar-level colors that cascade to child components (Button, Menu, etc.).
 * @platform android
 */
exports.ToolbarColorContext = (0, react_1.createContext)({});
function useToolbarColors() {
    return (0, react_1.useContext)(exports.ToolbarColorContext);
}
//# sourceMappingURL=context.js.map