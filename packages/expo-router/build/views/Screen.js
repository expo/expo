"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = Screen;
const native_1 = require("@react-navigation/native");
const useNavigation_1 = require("../useNavigation");
const useSafeLayoutEffect_1 = require("./useSafeLayoutEffect");
const stack_1 = require("../utils/stack");
/** Component for setting the current screen's options dynamically. */
function Screen({ name, options }) {
    if (name) {
        throw new Error(`The name prop on the Screen component may only be used when it is inside a Layout route`);
    }
    const route = (0, native_1.useRoute)();
    const navigation = (0, useNavigation_1.useNavigation)();
    const isFocused = navigation.isFocused();
    const isPreloaded = (0, stack_1.isRoutePreloadedInStack)(navigation.getState(), route);
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        if (options && Object.keys(options).length) {
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            if (!isPreloaded || (isPreloaded && isFocused)) {
                navigation.setOptions(options);
            }
        }
    }, [isFocused, isPreloaded, navigation, options]);
    return null;
}
//# sourceMappingURL=Screen.js.map