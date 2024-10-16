import EventEmitter from 'expo-modules-core/src/EventEmitter';

type DevLoadingEvents = {
  'devLoadingView:showMessage'(payload: { message: string }),
  'devLoadingView:hide'(),
};

/** The event emitter used for the dev loading view events */
export const emitter = new EventEmitter<DevLoadingEvents>();
