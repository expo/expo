"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBottomTabBarHeight = useBottomTabBarHeight;
const react_1 = require("react");
const BottomTabBarHeightContext_1 = require("./BottomTabBarHeightContext");
function useBottomTabBarHeight() {
    const height = (0, react_1.use)(BottomTabBarHeightContext_1.BottomTabBarHeightContext);
    if (height === undefined) {
        throw new Error("Couldn't find the bottom tab bar height. Are you inside a screen in Bottom Tab Navigator?");
    }
    return height;
}
//# sourceMappingURL=useBottomTabBarHeight.js.map