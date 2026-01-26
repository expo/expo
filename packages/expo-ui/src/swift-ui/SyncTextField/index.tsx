import "react-native-reanimated";

import { installOnUIRuntime, requireNativeView } from 'expo';
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { scheduleOnUI, runOnUISync } from 'react-native-worklets';

installOnUIRuntime();

declare const _WORKLET: boolean;

let viewIdCounter = 0;

type NativeSyncTextFieldProps = {
  viewId: string;
  defaultValue: string;
}

export type SyncTextFieldRef = {
  setState: (value: string) => void;
  getState: () => string;
}

type SyncTextFieldProps = {
  defaultValue?: string;
  onChangeSync?: (value: string) => string | void;
}

const SyncTextFieldNativeView: React.ComponentType<NativeSyncTextFieldProps> = requireNativeView(
  'ExpoUI',
  'SyncTextFieldView'
);

export const SyncTextField = forwardRef<SyncTextFieldRef, SyncTextFieldProps>((props, ref) => {
  const { defaultValue = '', onChangeSync } = props;
  const viewIdRef = useRef<string | null>(null);

  if (viewIdRef.current === null) {
    viewIdRef.current = `syncTextField_${viewIdCounter++}`;
  }
  const viewId = viewIdRef.current;

  // Register onChange callback
  useEffect(() => {
    if (!onChangeSync) return;

    scheduleOnUI(() => {
      'worklet';
      // @ts-ignore
      const registry = global.__expoSwiftUIState;
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
        // @ts-ignore
        const registry = global.__expoSwiftUIState;
        if (registry && registry[viewId]) {
          registry[viewId].onChange = undefined;
        }
      });
    };
  }, [viewId, onChangeSync]);

  useImperativeHandle(ref, () => ({
    setState: (value: string) => {
      'worklet';
      if (_WORKLET) {
        // @ts-ignore
        global.__expoSwiftUIState?.[viewId]?.setState?.(value);
      } else {
        scheduleOnUI(() => {
          'worklet';
          // @ts-ignore
          global.__expoSwiftUIState?.[viewId]?.setState?.(value);
        });
      }
    },
    getState: (): string => {
      'worklet';
      if (_WORKLET) {
        // @ts-ignore
        return global.__expoSwiftUIState?.[viewId]?.getState?.() ?? '';
      } else {
        return runOnUISync(() => {
          'worklet';
          // @ts-ignore
          return global.__expoSwiftUIState?.[viewId]?.getState?.() ?? '';
        });
      }
    },
  }), [viewId]);

  return (
    <SyncTextFieldNativeView viewId={viewId} defaultValue={defaultValue} />
  );
});