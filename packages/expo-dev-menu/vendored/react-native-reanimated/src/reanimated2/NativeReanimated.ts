// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Platform } from 'react-native';
import reanimatedJS from './js-reanimated';
import { nativeShouldBeMock } from './PlatformChecker';

let exportedModule;
if (nativeShouldBeMock()) {
  exportedModule = reanimatedJS;
} else {
  const InnerNativeModule = global.__reanimatedModuleProxy;

  const NativeReanimated = {
    native: true,
    useOnlyV1: InnerNativeModule == null,

    installCoreFunctions(valueSetter) {
      return InnerNativeModule.installCoreFunctions(valueSetter);
    },

    makeShareable(value) {
      return InnerNativeModule.makeShareable(value);
    },

    makeMutable(value) {
      return InnerNativeModule.makeMutable(value);
    },

    makeRemote(object) {
      return InnerNativeModule.makeRemote(object);
    },

    startMapper(mapper, inputs = [], outputs = [], updater, tag, name) {
      return InnerNativeModule.startMapper(
        mapper,
        inputs,
        outputs,
        updater,
        tag,
        name
      );
    },

    stopMapper(mapperId) {
      return InnerNativeModule.stopMapper(mapperId);
    },

    registerEventHandler(eventHash, eventHandler) {
      return InnerNativeModule.registerEventHandler(eventHash, eventHandler);
    },

    unregisterEventHandler(registrationId) {
      return InnerNativeModule.unregisterEventHandler(registrationId);
    },

    getViewProp(viewTag, propName, callback) {
      return InnerNativeModule.getViewProp(viewTag, propName, callback);
    },
  };

  if (NativeReanimated.useOnlyV1 && Platform.OS === 'android') {
    console.warn(
      `If you want to use Reanimated 2 then go through our installation steps https://docs.swmansion.com/react-native-reanimated/docs/installation`
    );
  }

  exportedModule = NativeReanimated;
}

export default exportedModule as any; // TODO: just temporary type
