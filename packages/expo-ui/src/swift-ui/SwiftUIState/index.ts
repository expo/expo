import "react-native-reanimated";

import { scheduleOnUI, runOnUISync } from "react-native-worklets"
import { installOnUIRuntime, requireNativeModule } from 'expo';
import { useEffect, useRef } from "react"

installOnUIRuntime();

declare const _WORKLET: boolean;

const ExpoUI = requireNativeModule('ExpoUI');
ExpoUI.initializeWorkletFunctions();

export type SwiftUIState<T> = {
  setValue: (value: T) => void;
  getValue: () => T;
  stateId: number;
};

export function useSwiftUIState<T>(initialValue: T): SwiftUIState<T> {
  const stateId = useRef<number | null>(null);

  if (stateId.current === null) {
    stateId.current = ExpoUI.createState(initialValue);
  }

  useEffect(() => {
    return () => {
      if (stateId.current !== null) {
        ExpoUI.deleteState(stateId.current);
        stateId.current = null;
      }
    };
  }, []);

  const setValue = (value: T) => {
    'worklet';
    if (_WORKLET) {
      // @ts-ignore
      global.__expoSwiftUIState.setValue(stateId.current, value);
    } else {
      scheduleOnUI(() => {
        'worklet';
        // @ts-ignore
        global.__expoSwiftUIState.setValue(stateId.current, value);
      });
    }
  }

  const getValue = (): T => {
    'worklet';
    if (_WORKLET) {
      // @ts-ignore
      return global.__expoSwiftUIState.getValue(stateId.current);
    } else {
      return runOnUISync(() => {
        'worklet';
        // @ts-ignore
        return global.__expoSwiftUIState.getValue(stateId.current);
      });
    }
  }

  return {
    setValue,
    getValue,
    stateId: stateId.current!,
  }
}

export function registerOnChange<T>(stateId: number, onChange: (value: T) => void) {
  scheduleOnUI(() => {
    'worklet';
    // @ts-ignore
    global.__expoSwiftUIState.onChange(stateId, (value: T) => {
      'worklet';
      onChange(value);
    });
  });
}