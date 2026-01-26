import { useRef} from "react"
import { requireNativeModule } from "expo"
import { scheduleOnUI, runOnUISync } from "react-native-worklets"

declare const _WORKLET: boolean;

const ExpoUI = requireNativeModule('ExpoUI');

export const useSwiftUIState = (initialValue: any) => {
  const stateId = useRef<number | null>(null);

  const deleteState = () => {
    ExpoUI.deleteState(stateId.current);
  }

  const setValue = (value: any) => {
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

  const getValue = () => {
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
    deleteState,
    stateId,
  }
}