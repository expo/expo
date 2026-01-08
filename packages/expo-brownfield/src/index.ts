import type { EventSubscription } from 'expo-modules-core';
import NativeModule from './ExpoBrownfieldModule';
import type { ExpoBrownfieldModuleSpec, Listener, MessageEvent } from './types';

class ExpoBrownfieldModule {
  nativeModule: ExpoBrownfieldModuleSpec;

  constructor(nativeModule: ExpoBrownfieldModuleSpec) {
    this.nativeModule = nativeModule;
  }

  popToNative(animated: boolean = false): void {
    this.nativeModule.popToNative(animated);
  }

  sendMessage(message: Record<string, any>) {
    this.nativeModule.sendMessage(message);
  }

  setNativeBackEnabled(enabled: boolean): void {
    this.nativeModule.setNativeBackEnabled(enabled);
  }

  addListener(listener: Listener<MessageEvent>): EventSubscription {
    return this.nativeModule.addListener('onMessage', listener);
  }

  listenerCount() {
    return this.nativeModule.listenerCount('onMessage');
  }

  removeAllListeners() {
    return this.nativeModule.removeAllListeners('onMessage');
  }

  removeListener(listener: Listener<MessageEvent>) {
    return this.nativeModule.removeListener('onMessage', listener);
  }
}

export type { MessageEvent };

export default new ExpoBrownfieldModule(NativeModule);
