import { useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import ExpoNavigationBar from './ExpoNavigationBar';
function isLightColorScheme() {
    const colorScheme = Appearance?.getColorScheme() ?? 'light';
    return colorScheme === 'light';
}
function resolveStyle(style) {
    switch (style) {
        case 'auto':
            return isLightColorScheme() ? 'dark' : 'light';
        case 'inverted':
            return isLightColorScheme() ? 'light' : 'dark';
        default:
            return style;
    }
}
// Merges the entries stack
function mergeEntriesStack(entriesStack) {
    return entriesStack.reduce((prev, cur) => {
        for (const prop in cur) {
            if (cur[prop] != null) {
                // @ts-expect-error
                prev[prop] = cur[prop];
            }
        }
        return prev;
    }, {
        style: undefined,
        hidden: undefined,
    });
}
// Returns an object to insert in the props stack from the props
function createStackEntry({ style, hidden }) {
    return { style, hidden }; // Create a copy
}
const entriesStack = [];
// Timer for updating the native module values at the end of the frame
let updateImmediate = null;
// The current merged values from the entries stack
const currentValues = {
    style: undefined,
    hidden: undefined,
};
function setResolvedStyle(style) {
    if (style !== currentValues.style) {
        currentValues.style = style;
        ExpoNavigationBar.setStyle(style ?? 'light');
    }
}
function setHidden(hidden) {
    if (hidden !== currentValues.hidden) {
        currentValues.hidden = hidden;
        ExpoNavigationBar.setHidden(hidden);
    }
}
// Updates the native navigation bar with the entries from the stack
function updateEntriesStack() {
    if (updateImmediate != null) {
        clearImmediate(updateImmediate);
    }
    updateImmediate = setImmediate(() => {
        const mergedEntries = mergeEntriesStack(entriesStack);
        const { hidden } = mergedEntries;
        setResolvedStyle(resolveStyle(mergedEntries.style));
        if (hidden != null) {
            setHidden(hidden);
        }
    });
}
function pushStackEntry(props) {
    const entry = createStackEntry(props);
    entriesStack.push(entry);
    updateEntriesStack();
    return entry;
}
function popStackEntry(entry) {
    const index = entriesStack.indexOf(entry);
    if (index !== -1) {
        entriesStack.splice(index, 1);
    }
    updateEntriesStack();
}
function replaceStackEntry(entry, props) {
    const newEntry = createStackEntry(props);
    const index = entriesStack.indexOf(entry);
    if (index !== -1) {
        entriesStack[index] = newEntry;
    }
    updateEntriesStack();
    return newEntry;
}
export function NavigationBar({ style, hidden }) {
    const colorScheme = useColorScheme();
    const stableProps = useMemo(() => ({ style, hidden }), [style, hidden]);
    const stackEntryRef = useRef(null);
    useEffect(() => {
        // Every time a NavigationBar component is mounted, we push it's prop to a stack
        // and always update the native navigation bar with the props from the top of then
        // stack. This allows having multiple NavigationBar components and the one that is
        // added last or is deeper in the view hierarchy will have priority.
        stackEntryRef.current = pushStackEntry(stableProps);
        return () => {
            // When a NavigationBar is unmounted, remove itself from the stack and update
            // the native bar with the next props.
            if (stackEntryRef.current) {
                popStackEntry(stackEntryRef.current);
            }
        };
    }, []);
    useEffect(() => {
        if (stackEntryRef.current) {
            stackEntryRef.current = replaceStackEntry(stackEntryRef.current, stableProps);
        }
    }, [colorScheme, stableProps]);
    return null;
}
NavigationBar.setStyle = (style) => {
    const resolvedStyle = resolveStyle(style);
    if (typeof resolvedStyle === 'string') {
        setResolvedStyle(resolvedStyle);
    }
};
export const setStyle = NavigationBar.setStyle;
NavigationBar.setHidden = setHidden;
export function addVisibilityListener(listener) {
    return ExpoNavigationBar.addListener('ExpoNavigationBar.didChange', listener);
}
export async function setVisibilityAsync(visibility) {
    await ExpoNavigationBar.setHidden(visibility === 'hidden');
}
export async function getVisibilityAsync() {
    return ExpoNavigationBar.getVisibilityAsync();
}
export function useVisibility() {
    const [visibility, setVisible] = useState(null);
    useEffect(() => {
        let isMounted = true;
        getVisibilityAsync().then((visibility) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        const listener = addVisibilityListener(({ visibility }) => {
            if (isMounted) {
                setVisible(visibility);
            }
        });
        return () => {
            listener.remove();
            isMounted = false;
        };
    }, []);
    return visibility;
}
//# sourceMappingURL=NavigationBar.android.js.map