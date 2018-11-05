import { DeviceEventEmitter, NativeModules } from 'react-native';

const { ExponentKernel } = NativeModules;

const addListenerWithNativeCallback = (eventName, eventListener) => {
  if (ExponentKernel) {
    DeviceEventEmitter.addListener(eventName, async (event) => {
      try {
        let result = await eventListener(event);
        if (!result) {
          result = {};
        }
        ExponentKernel.onEventSuccess(event.eventId, result);
      } catch (e) {
        ExponentKernel.onEventFailure(event.eventId, e.message);
      }
    });
  }
};

export default addListenerWithNativeCallback;
