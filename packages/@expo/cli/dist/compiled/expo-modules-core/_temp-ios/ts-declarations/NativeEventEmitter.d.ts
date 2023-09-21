declare module 'react-native/Libraries/EventEmitter/NativeEventEmitter' {
  import { EventEmitter } from 'react-native';

  interface NativeEventEmitter extends EventEmitter {
    new (nativeModule: NativeModule): NativeEventEmitters;
  }

  const NativeEventEmitter: NativeEventEmitter;

  export default NativeEventEmitter;

  type NativeModule = {
    addListener: (eventType: string) => void;
    removeListeners: (count: number) => void;
  };
}
