import React from 'react';
import { useNavigation } from '../useNavigation';
const useLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : function () { };
/** Component for setting the current screen's options dynamically. */
export function Screen({ name, options }) {
    const navigation = useNavigation(name);
    useLayoutEffect(() => {
        if (options &&
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            Object.keys(options).length) {
            navigation.setOptions(options);
        }
    }, [navigation, options]);
    return null;
}
//# sourceMappingURL=Screen.js.map