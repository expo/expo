import type { NativeModule } from 'expo';

export type KeyRecreatedEvent = {
  key: string;
};

export type Events = {
  onKeyRecreated: (event: KeyRecreatedEvent) => void;
};

export declare class ExpoBrownfieldStateModuleSpec extends NativeModule<Events> {
  getSharedState(key: string): any;
  deleteSharedState(key: string): void;
}
