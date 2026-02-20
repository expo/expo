"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarPlacementContext = void 0;
exports.useToolbarPlacement = useToolbarPlacement;
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
//# sourceMappingURL=context.js.map