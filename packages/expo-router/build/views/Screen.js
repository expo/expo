import React from 'react';
import { useDeprecated } from '../useDeprecated';
import { useNavigation } from '../useNavigation';
const useLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : function () { };
/** Component for setting the current screen's options dynamically. */
export function Screen({ name, redirect, options, }) {
    const navigation = useNavigation(name);
    useLayoutEffect(() => {
        if (options &&
            // React Navigation will infinitely loop in some cases if an empty object is passed to setOptions.
            // https://github.com/expo/router/issues/452
            Object.keys(options).length) {
            navigation.setOptions(options);
        }
    }, [navigation, options]);
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useDeprecated('The `redirect` prop on <Screen /> is deprecated and will be removed. Please use `router.redirect` instead', redirect != null);
    }
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
            if (redirect != null) {
                throw new Error('Screen components should only use the `redirect` prop when nested directly inside a Layout component.');
            }
        }, [name, redirect]);
    }
    return null;
}
//# sourceMappingURL=Screen.js.map