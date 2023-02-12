import { NativeModules } from 'react-native';
const { RNGestureHandlerModule } = NativeModules;

if (RNGestureHandlerModule == null) {
  console.error(
    `react-native-gesture-handler module was not found. Make sure you're running your app on the native platform and your code is linked properly (cd ios && pod install && cd ..).

    For installation instructions, please refer to https://docs.swmansion.com/react-native-gesture-handler/docs/#installation`
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
  );
}

export type RNGestureHandlerModuleProps = {
  handleSetJSResponder: (tag: number, blockNativeResponder: boolean) => void;
  handleClearJSResponder: () => void;
  createGestureHandler: (
    handlerName: string,
    handlerTag: number,
    config: Readonly<Record<string, unknown>>
  ) => void;
  attachGestureHandler: (
    handlerTag: number,
    newView: number,
    usingDeviceEvents: boolean
  ) => void;
  updateGestureHandler: (
    handlerTag: number,
    newConfig: Readonly<Record<string, unknown>>
  ) => void;
  dropGestureHandler: (handlerTag: number) => void;
};

export default RNGestureHandlerModule as RNGestureHandlerModuleProps;
