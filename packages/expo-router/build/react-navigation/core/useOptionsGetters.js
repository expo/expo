'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationStateContext } from './NavigationStateContext';
export function useOptionsGetters({ key, options, navigation }) {
    const optionsRef = React.useRef(options);
    const optionsGettersFromChildRef = React.useRef({});
    const { onOptionsChange } = use(NavigationBuilderContext);
    const { addOptionsGetter: parentAddOptionsGetter } = use(NavigationStateContext);
    const optionsChangeListener = React.useCallback(() => {
        const isFocused = navigation?.isFocused() ?? true;
        const hasChildren = Object.keys(optionsGettersFromChildRef.current).length;
        if (isFocused && !hasChildren) {
            onOptionsChange(optionsRef.current ?? {});
        }
    }, [navigation, onOptionsChange]);
    React.useEffect(() => {
        optionsRef.current = options;
        optionsChangeListener();
        return navigation?.addListener('focus', optionsChangeListener);
    }, [navigation, options, optionsChangeListener]);
    const getOptionsFromListener = React.useCallback(() => {
        for (const key in optionsGettersFromChildRef.current) {
            if (key in optionsGettersFromChildRef.current) {
                const result = optionsGettersFromChildRef.current[key]?.();
                // null means unfocused route
                if (result !== null) {
                    return result;
                }
            }
        }
        return null;
    }, []);
    const getCurrentOptions = React.useCallback(() => {
        const isFocused = navigation?.isFocused() ?? true;
        if (!isFocused) {
            return null;
        }
        const optionsFromListener = getOptionsFromListener();
        if (optionsFromListener !== null) {
            return optionsFromListener;
        }
        return optionsRef.current;
    }, [navigation, getOptionsFromListener]);
    React.useEffect(() => {
        return parentAddOptionsGetter?.(key, getCurrentOptions);
    }, [getCurrentOptions, parentAddOptionsGetter, key]);
    const addOptionsGetter = React.useCallback((key, getter) => {
        optionsGettersFromChildRef.current[key] = getter;
        optionsChangeListener();
        return () => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete optionsGettersFromChildRef.current[key];
            optionsChangeListener();
        };
    }, [optionsChangeListener]);
    return {
        addOptionsGetter,
        getCurrentOptions,
    };
}
//# sourceMappingURL=useOptionsGetters.js.map