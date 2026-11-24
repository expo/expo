import { requireOptionalNativeModule, NativeModule, SharedObject } from 'expo';

type SerializableRef<TValue = unknown> = {
  __serializableRef: true;
  __nativeStateSerializableJSRef: TValue;
};

declare class WorkletsTesterCounter extends SharedObject {
  // A hidden property that native installs. Worklets pass shared objects by this ID.
  readonly __expo_shared_object_id__: number;
  constructor(value: number);
  readonly value: number;
  increment(): number;
}

declare class WorkletsTesterModule extends NativeModule {
  WorkletsTesterCounter: typeof WorkletsTesterCounter;

  isUIRuntimeWorkOnMainThread(): Promise<boolean>;
  evaluateOnUIRuntime(source: string): Promise<string>;

  executeWorklet(worklet: SerializableRef<() => void>): void;
  scheduleWorklet(worklet: SerializableRef<() => void>): void;

  executeWorkletWithArgs(
    worklet: SerializableRef<(num: number, str: string, bool: boolean) => void>
  ): void;
  scheduleWorkletWithArgs(
    worklet: SerializableRef<(num: number, str: string, bool: boolean) => void>
  ): void;
}

export default requireOptionalNativeModule<WorkletsTesterModule>('WorkletsTesterModule');
