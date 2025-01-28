'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFocusEffect = void 0;
// A fork of `useFocusEffect` that waits for the navigation state to load before
// running the effect. This is especially useful for native redirects.
const React = __importStar(require("react"));
const useLoadedNavigation_1 = require("./link/useLoadedNavigation");
/**
 * Hook to run an effect whenever a route is **focused**. Similar to
 * [`React.useEffect`](https://react.dev/reference/react/useEffect).
 *
 * This can be used to perform side-effects such as fetching data or subscribing to events.
 * The passed callback should be wrapped in [`React.useCallback`](https://react.dev/reference/react/useCallback)
 * to avoid running the effect too often.
 *
 * @example
 * ```tsx
 * import { useFocusEffect } from 'expo-router';
 * import { useCallback } from 'react';
 *
 * export default function Route() {
 *   useFocusEffect(
 *     // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
 *     useCallback(() => {
 *       // Invoked whenever the route is focused.
 *       console.log('Hello, I'm focused!');
 *
 *       // Return function is invoked whenever the route gets out of focus.
 *       return () => {
 *         console.log('This route is now unfocused.');
 *       };
 *     }, []);
 *    );
 *
 *  return </>;
 * }
 *```
 *
 * @param effect Memoized callback containing the effect, should optionally return a cleanup function.
 * @param do_not_pass_a_second_prop
 */
function useFocusEffect(effect, do_not_pass_a_second_prop) {
    const navigation = (0, useLoadedNavigation_1.useOptionalNavigation)();
    if (do_not_pass_a_second_prop !== undefined) {
        const message = "You passed a second argument to 'useFocusEffect', but it only accepts one argument. " +
            "If you want to pass a dependency array, you can use 'React.useCallback':\n\n" +
            'useFocusEffect(\n' +
            '  React.useCallback(() => {\n' +
            '    // Your code here\n' +
            '  }, [depA, depB])\n' +
            ');\n\n' +
            'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
        console.error(message);
    }
    React.useEffect(() => {
        if (!navigation) {
            return;
        }
        let isFocused = false;
        let cleanup;
        const callback = () => {
            const destroy = effect();
            if (destroy === undefined || typeof destroy === 'function') {
                return destroy;
            }
            if (process.env.NODE_ENV !== 'production') {
                let message = 'An effect function must not return anything besides a function, which is used for clean-up.';
                if (destroy === null) {
                    message +=
                        " You returned 'null'. If your effect does not require clean-up, return 'undefined' (or nothing).";
                }
                else if (typeof destroy.then === 'function') {
                    message +=
                        "\n\nIt looks like you wrote 'useFocusEffect(async () => ...)' or returned a Promise. " +
                            'Instead, write the async function inside your effect ' +
                            'and call it immediately:\n\n' +
                            'useFocusEffect(\n' +
                            '  React.useCallback(() => {\n' +
                            '    async function fetchData() {\n' +
                            '      // You can await here\n' +
                            '      const response = await MyAPI.getData(someId);\n' +
                            '      // ...\n' +
                            '    }\n\n' +
                            '    fetchData();\n' +
                            '  }, [someId])\n' +
                            ');\n\n' +
                            'See usage guide: https://reactnavigation.org/docs/use-focus-effect';
                }
                else {
                    message += ` You returned '${JSON.stringify(destroy)}'.`;
                }
                console.error(message);
            }
        };
        // We need to run the effect on initial render/dep changes if the screen is focused
        if (navigation.isFocused()) {
            cleanup = callback();
            isFocused = true;
        }
        const unsubscribeFocus = navigation.addListener('focus', () => {
            // If callback was already called for focus, avoid calling it again
            // The focus event may also fire on initial render, so we guard against running the effect twice
            if (isFocused) {
                return;
            }
            if (cleanup !== undefined) {
                cleanup();
            }
            cleanup = callback();
            isFocused = true;
        });
        const unsubscribeBlur = navigation.addListener('blur', () => {
            if (cleanup !== undefined) {
                cleanup();
            }
            cleanup = undefined;
            isFocused = false;
        });
        return () => {
            if (cleanup !== undefined) {
                cleanup();
            }
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [effect, navigation]);
}
exports.useFocusEffect = useFocusEffect;
//# sourceMappingURL=useFocusEffect.js.map