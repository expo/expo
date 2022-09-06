import { NativeEvent } from './commonTypes';
import NativeReanimatedModule from './NativeReanimated';

function jsListener<T extends NativeEvent<T>>(
  eventName: string,
  handler: (event: T) => void
) {
  return (evt: T) => {
    handler({ ...evt.nativeEvent, eventName });
  };
}

export default class WorkletEventHandler<T extends NativeEvent<T>> {
  worklet: (event: T) => void;
  eventNames: string[];
  reattachNeeded: boolean;
  listeners: Record<string, (event: T) => void>;
  viewTag: number | undefined;
  registrations: string[];
  constructor(worklet: (event: T) => void, eventNames: string[] = []) {
    this.worklet = worklet;
    this.eventNames = eventNames;
    this.reattachNeeded = false;
    this.listeners = {};
    this.viewTag = undefined;
    this.registrations = [];

    if (!NativeReanimatedModule.native) {
      this.listeners = eventNames.reduce(
        (acc: Record<string, (event: T) => void>, eventName: string) => {
          acc[eventName] = jsListener(eventName, worklet);
          return acc;
        },
        {}
      );
    }
  }

  updateWorklet(newWorklet: (event: T) => void): void {
    this.worklet = newWorklet;
    this.reattachNeeded = true;
  }

  registerForEvents(viewTag: number, fallbackEventName?: string): void {
    this.viewTag = viewTag;
    this.registrations = this.eventNames.map((eventName) =>
      NativeReanimatedModule.registerEventHandler(
        viewTag + eventName,
        this.worklet
      )
    );
    if (this.registrations.length === 0 && fallbackEventName) {
      this.registrations.push(
        NativeReanimatedModule.registerEventHandler(
          viewTag + fallbackEventName,
          this.worklet
        )
      );
    }
  }

  unregisterFromEvents(): void {
    this.registrations.forEach((id) =>
      NativeReanimatedModule.unregisterEventHandler(id)
    );
    this.registrations = [];
  }
}
