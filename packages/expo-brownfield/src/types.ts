import type { NativeModule } from 'expo';

export type MessageEvent = Record<string, any>;

export type Listener<E> = (event: E) => void;

export type ExpoBrownfieldModuleEvents = {
  onMessage: (event: MessageEvent) => void;
};

export declare class ExpoBrownfieldModuleSpec extends NativeModule<ExpoBrownfieldModuleEvents> {
  popToNative(animated: boolean): void;
  setNativeBackEnabled(enabled: boolean): void;
  sendMessage(message: Record<string, any>): void;
}

// TODO(pmleczek): Separate if we go with this

export type StateChangeEvent = Record<string, any>;

export type ExpoBrownfieldStateModuleEvents = {
  onStateChange: (event: StateChangeEvent) => void;
};

export declare class ExpoBrownfieldStateModuleSpec extends NativeModule<ExpoBrownfieldStateModuleEvents> {
  get<T extends Record<string, any>>(key: string): T;
  set<T extends Record<string, any>>(key: string, value: T): T;
}
