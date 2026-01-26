import { useRef } from "react"
import { scheduleOnUI, runOnUISync } from "react-native-worklets"

declare const _WORKLET: boolean;

export function useSwiftUIState<T>(initialValue: T, onChange: (value: T) => void) {
  const stateId = useRef<number | null>(null);

  const setStateId = (id: number) => {
    stateId.current = id;
    scheduleOnUI(() => {
      'worklet';
      // @ts-ignore
      global.__expoSwiftUIState.onChange(id, () => {
        'worklet';
        // @ts-ignore
        const value = onChange(global.__expoSwiftUIState.getValue(id));
        if (value !== undefined) {
          // @ts-ignore
          global.__expoSwiftUIState.setValue(id, value);
        }
      });
    });
  }

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

  const getValue = () : T => {
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
    initialValue,
    setStateId,
  }
}