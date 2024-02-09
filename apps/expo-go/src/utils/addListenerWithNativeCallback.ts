import { DeviceEventEmitter } from 'react-native';

import * as Kernel from '../kernel/Kernel';

const addListenerWithNativeCallback = (
  eventName: string,
  eventListener: (event: any) => Promise<any>
) => {
  return DeviceEventEmitter.addListener(eventName, async (event) => {
    try {
      let result = await eventListener(event);
      if (!result) {
        result = {};
      }
      Kernel.onEventSuccess(event.eventId, result);
    } catch (e) {
      Kernel.onEventFailure(event.eventId, e.message);
    }
  });
};

export default addListenerWithNativeCallback;
