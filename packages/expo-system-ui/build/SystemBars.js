import { memo, useEffect, useRef } from 'react';
import { Appearance, Platform, StatusBar } from 'react-native';
import ExpoSystemUI from './ExpoSystemUI';
function getColorScheme() {
    return Appearance?.getColorScheme() ?? 'light';
}
/**
 * Merges the props stack.
 */
function mergePropsStack(propsStack) {
    const mergedEntry = propsStack.reduce((prev, cur) => {
        for (const prop in cur) {
            if (cur[prop] != null) {
                prev[prop] = cur[prop];
            }
        }
        return prev;
    }, {
        statusBarStyle: undefined,
        statusBarHidden: undefined,
        navigationBarHidden: undefined,
    });
    if (mergedEntry.statusBarStyle == null &&
        mergedEntry.statusBarHidden == null &&
        mergedEntry.navigationBarHidden == null) {
        return null;
    }
    else {
        return mergedEntry;
    }
}
const propsStack = [];
// Timer for updating the native module values at the end of the frame.
let updateImmediate = null;
// The current merged values from the props stack.
let currentValues = null;
function applyStackEntry(entry, colorScheme) {
    const { statusBarHidden, navigationBarHidden } = entry;
    const autoBarStyle = colorScheme === 'light' ? 'dark' : 'light';
    const statusBarStyle = entry.statusBarStyle === 'auto' ? autoBarStyle : entry.statusBarStyle;
    if (Platform.OS === 'android') {
        ExpoSystemUI.setSystemBarsConfigAsync({
            statusBarStyle,
            statusBarHidden,
            navigationBarHidden,
        });
    }
    else {
        // Emulate android behavior with react-native StatusBar
        if (statusBarStyle != null) {
            StatusBar.setBarStyle(`${statusBarStyle}-content`, true);
        }
        if (statusBarHidden != null) {
            StatusBar.setHidden(statusBarHidden, 'fade'); // 'slide' doesn't work in this context
        }
    }
}
/**
 * Updates the native system bars with the props from the stack.
 */
function updatePropsStack() {
    if (updateImmediate != null) {
        clearImmediate(updateImmediate);
    }
    updateImmediate = setImmediate(() => {
        const oldProps = currentValues;
        const mergedProps = mergePropsStack(propsStack);
        if (mergedProps != null) {
            if (oldProps?.statusBarStyle !== mergedProps.statusBarStyle ||
                oldProps?.statusBarHidden !== mergedProps.statusBarHidden ||
                oldProps?.navigationBarHidden !== mergedProps.navigationBarHidden) {
                applyStackEntry(mergedProps, mergedProps.statusBarStyle === 'auto' ? getColorScheme() : null);
            }
            currentValues = mergedProps;
        }
        else {
            currentValues = null;
        }
    });
}
/**
 * Push a SystemBars entry onto the stack.
 * The return value should be passed to `popStackEntry` when complete.
 *
 * @param props Object containing the SystemBars props to use in the stack entry.
 */
function pushStackEntry(props) {
    const copy = { ...props };
    propsStack.push(copy);
    updatePropsStack();
    return copy;
}
/**
 * Pop a SystemBars entry from the stack.
 *
 * @param entry Entry returned from `pushStackEntry`.
 */
function popStackEntry(entry) {
    const index = propsStack.indexOf(entry);
    if (index !== -1) {
        propsStack.splice(index, 1);
    }
    updatePropsStack();
}
/**
 * Replace an existing SystemBars stack entry with new props.
 *
 * @param entry Entry returned from `pushStackEntry` to replace.
 * @param props Object containing the SystemBars props to use in the replacement stack entry.
 */
function replaceStackEntry(entry, props) {
    const copy = { ...props };
    const index = propsStack.indexOf(entry);
    if (index !== -1) {
        propsStack[index] = copy;
    }
    updatePropsStack();
    return copy;
}
export const SystemBars = memo((props) => {
    const stackEntryRef = useRef(null);
    useEffect(() => {
        // Every time a SystemBars component is mounted, we push it's prop to a stack
        // and always update the native system bars with the props from the top of then
        // stack. This allows having multiple SystemBars components and the one that is
        // added last or is deeper in the view hierarchy will have priority.
        stackEntryRef.current = pushStackEntry(props);
        return () => {
            // When a SystemBars is unmounted, remove itself from the stack and update
            // the native bars with the next props.
            if (stackEntryRef.current) {
                popStackEntry(stackEntryRef.current);
            }
        };
    }, []);
    useEffect(() => {
        if (stackEntryRef.current) {
            stackEntryRef.current = replaceStackEntry(stackEntryRef.current, props);
        }
    }, [props]);
    return null;
});
SystemBars.displayName = 'SystemBars';
//# sourceMappingURL=SystemBars.js.map