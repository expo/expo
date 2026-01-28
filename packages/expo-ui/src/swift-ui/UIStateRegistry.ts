import 'react-native-reanimated';

import { installOnUIRuntime } from 'expo';
import { useRef, useEffect } from 'react';
import { scheduleOnUI, runOnUISync } from 'react-native-worklets';

installOnUIRuntime();

declare const _WORKLET: boolean;

type ExpoSwiftUIStateEntry = {
  onChange?: (value: string) => string | void;
  setState?: (value: string) => void;
  getState?: () => string;
};

type ExpoSwiftUIStateRegistry = Record<string, ExpoSwiftUIStateEntry | undefined>;

const getRegistry = (): ExpoSwiftUIStateRegistry | undefined => {
  'worklet';
  return (globalThis as typeof globalThis & { __expoSwiftUIState?: ExpoSwiftUIStateRegistry })
    .__expoSwiftUIState;
};

let viewIdCounter = 0;

type UseUIStateRegistryOptions = {
  onChangeSync?: (value: string) => string | void;
};

type UseUIStateRegistryResult = {
  viewId: string;
  setState: (value: string) => void;
  getState: () => string;
};

export function useUIStateRegistry(options: UseUIStateRegistryOptions): UseUIStateRegistryResult {
  const { onChangeSync } = options;
  const viewIdRef = useRef<string | null>(null);

  if (viewIdRef.current === null) {
    viewIdRef.current = `${viewIdCounter++}`;
  }
  const viewId = viewIdRef.current;

  useEffect(() => {
    if (!onChangeSync) return;

    scheduleOnUI(() => {
      'worklet';
      const registry = getRegistry();
      if (registry && registry[viewId]) {
        registry[viewId].onChange = (value: string) => {
          'worklet';
          return onChangeSync(value);
        };
      }
    });

    return () => {
      scheduleOnUI(() => {
        'worklet';
        const registry = getRegistry();
        if (registry && registry[viewId]) {
          registry[viewId].onChange = undefined;
        }
      });
    };
  }, [viewId, onChangeSync]);

  const setState = (value: string) => {
    'worklet';
    if (_WORKLET) {
      getRegistry()?.[viewId]?.setState?.(value);
    } else {
      scheduleOnUI(() => {
        'worklet';
        getRegistry()?.[viewId]?.setState?.(value);
      });
    }
  };

  const getState = (): string => {
    'worklet';
    if (_WORKLET) {
      return getRegistry()?.[viewId]?.getState?.() ?? '';
    } else {
      return runOnUISync(() => {
        'worklet';
        return getRegistry()?.[viewId]?.getState?.() ?? '';
      });
    }
  };

  return { viewId, setState, getState };
}
