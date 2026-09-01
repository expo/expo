'use client';
import * as React from 'react';
import { use } from 'react';

import useLatestCallback from '../../utils/useLatestCallback';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import { NavigationStateContext } from './NavigationStateContext';
import { useIsRouteFocused } from './useIsFocused';

type Options = {
  key?: string;
  options?: object | undefined;
};

export function useOptionsGetters({ key, options }: Options) {
  const optionsRef = React.useRef<object | undefined>(options);
  const optionsGettersFromChildRef = React.useRef<Record<string, () => object | undefined | null>>(
    {}
  );

  const { onOptionsChange } = use(NavigationBuilderContext);
  const { addOptionsGetter: parentAddOptionsGetter } = use(NavigationStateContext);
  const isFocused = useIsRouteFocused(key);

  const optionsChangeListener = React.useCallback(() => {
    const hasChildren = Object.keys(optionsGettersFromChildRef.current).length;

    if (isFocused && !hasChildren) {
      onOptionsChange(optionsRef.current ?? {}, key);
    }
  }, [isFocused, key, onOptionsChange]);

  React.useEffect(() => {
    optionsRef.current = options;
    optionsChangeListener();
  }, [options, optionsChangeListener]);

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

  const getCurrentOptions = useLatestCallback(() => {
    if (!isFocused) {
      return null;
    }

    const optionsFromListener = getOptionsFromListener();

    if (optionsFromListener !== null) {
      return optionsFromListener;
    }

    return optionsRef.current;
  });

  React.useEffect(() => {
    return parentAddOptionsGetter?.(key!, getCurrentOptions);
  }, [getCurrentOptions, parentAddOptionsGetter, key]);

  const addOptionsGetter = React.useCallback(
    (key: string, getter: () => object | undefined | null) => {
      optionsGettersFromChildRef.current[key] = getter;
      optionsChangeListener();

      return () => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete optionsGettersFromChildRef.current[key];
        optionsChangeListener();
      };
    },
    [optionsChangeListener]
  );

  return {
    addOptionsGetter,
    getCurrentOptions,
  };
}
