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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useKeyboardManager = useKeyboardManager;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
function useKeyboardManager({ enabled, focused }) {
    // Numeric id of the previously focused text input
    // When a gesture didn't change the tab, we can restore the focused input with this
    const previouslyFocusedTextInputRef = React.useRef(undefined);
    const startTimestampRef = React.useRef(0);
    const keyboardTimeoutRef = React.useRef(undefined);
    const enabledRef = React.useRef(enabled);
    const clearKeyboardTimeout = React.useCallback(() => {
        if (keyboardTimeoutRef.current !== undefined) {
            clearTimeout(keyboardTimeoutRef.current);
            keyboardTimeoutRef.current = undefined;
        }
    }, []);
    const onPageChangeStart = React.useCallback(() => {
        if (!enabledRef.current) {
            return;
        }
        clearKeyboardTimeout();
        const input = react_native_1.TextInput.State.currentlyFocusedInput();
        // When a page change begins, blur the currently focused input
        input?.blur();
        // Store the id of this input so we can refocus it if change was cancelled
        previouslyFocusedTextInputRef.current = input;
        // Store timestamp for touch start
        startTimestampRef.current = Date.now();
    }, [clearKeyboardTimeout]);
    const onPageChangeCancel = React.useCallback(() => {
        if (!enabledRef.current) {
            return;
        }
        clearKeyboardTimeout();
        // The page didn't change, we should restore the focus of text input
        const input = previouslyFocusedTextInputRef.current;
        if (input) {
            // If the interaction was super short we should make sure keyboard won't hide again.
            // Too fast input refocus will result only in keyboard flashing on screen and hiding right away.
            // During first ~100ms keyboard will be dismissed no matter what,
            // so we have to make sure it won't interrupt input refocus logic.
            // That's why when the interaction is shorter than 100ms we add delay so it won't hide once again.
            // Subtracting timestamps makes us sure the delay is executed only when needed.
            if (Date.now() - startTimestampRef.current < 100) {
                keyboardTimeoutRef.current = setTimeout(() => {
                    input?.focus();
                    previouslyFocusedTextInputRef.current = undefined;
                }, 100);
            }
            else {
                input?.focus();
                previouslyFocusedTextInputRef.current = undefined;
            }
        }
    }, [clearKeyboardTimeout]);
    const onPageChangeConfirm = React.useCallback(({ gesture, active, closing }) => {
        if (!enabledRef.current) {
            return;
        }
        if (!closing) {
            onPageChangeCancel();
            return;
        }
        clearKeyboardTimeout();
        if (!gesture) {
            // Always dismiss input, even if we don't have a ref to it
            // We might not have the ref if onPageChangeStart was never called
            // This can happen if page change was not from a gesture
            react_native_1.Keyboard.dismiss();
        }
        else if (active) {
            const input = previouslyFocusedTextInputRef.current;
            // Dismiss the keyboard only if an input was a focused before
            // This makes sure we don't dismiss input on going back and focusing an input
            input?.blur();
        }
        // Cleanup the ID on successful page change
        previouslyFocusedTextInputRef.current = undefined;
    }, [clearKeyboardTimeout, onPageChangeCancel]);
    // Dismiss keyboard when screen loses focus (e.g. when pushing a new screen).
    // This handles the "navigate forward" case so we don't dismiss the new screen's
    // auto-focused input from handleTransition.
    React.useLayoutEffect(() => {
        if (enabledRef.current && !focused) {
            react_native_1.Keyboard.dismiss();
        }
    }, [focused]);
    React.useLayoutEffect(() => {
        enabledRef.current = enabled;
    });
    React.useEffect(() => {
        return () => clearKeyboardTimeout();
    }, [clearKeyboardTimeout]);
    return {
        onPageChangeStart,
        onPageChangeConfirm,
        onPageChangeCancel,
    };
}
//# sourceMappingURL=useKeyboardManager.js.map