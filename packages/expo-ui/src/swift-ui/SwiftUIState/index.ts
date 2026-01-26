import { useState , useEffect} from "react"
import { requireNativeModule } from "expo"  
const ExpoUI = requireNativeModule('ExpoUI');

export const useSwiftUIState = (initialValue: any) => {
  const [stateId, setStateId] = useState();

  const deleteState = () => {
    ExpoUI.deleteState(stateId);
  }

  const setValue = (value: any) => {
    'worklet';
    // @ts-ignore
    global.__expoSwiftUIState.setValue(stateId, value);
  }

  const getValue = () => {
    'worklet';
    // @ts-ignore
    return global.__expoSwiftUIState.getValue(stateId);
  }

  useEffect(() => {
    const _stateId = ExpoUI.createState(initialValue);
    setStateId(_stateId);
    return () => {
      ExpoUI.deleteState(_stateId as number);
    }
  }, [initialValue]);

  return {
    setValue,
    getValue,
    deleteState,
    stateId,
  }
}