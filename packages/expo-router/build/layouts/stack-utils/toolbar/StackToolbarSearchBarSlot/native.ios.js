"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarSearchBarSlot = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("../../../../toolbar/native");
/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
const NativeToolbarSearchBarSlot = ({ hidesSharedBackground, hidden, separateBackground, }) => {
    const id = (0, react_1.useId)();
    if (process.env.EXPO_OS !== 'ios' || parseInt(String(react_native_1.Platform.Version).split('.')[0], 10) < 26) {
        return null;
    }
    if (hidden) {
        return null;
    }
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} identifier={id} sharesBackground={!separateBackground} type="searchBar"/>);
};
exports.NativeToolbarSearchBarSlot = NativeToolbarSearchBarSlot;
//# sourceMappingURL=native.ios.js.map