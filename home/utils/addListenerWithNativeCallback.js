import { DeviceEventEmitter } from 'react-native';

import ExponentKernel from '../universal/ExponentKernel';

const addListenerWithNativeCallback = (eventName, eventListener) => {
  if (ExponentKernel) {
    DeviceEventEmitter.addListener(eventName, async event => {
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
