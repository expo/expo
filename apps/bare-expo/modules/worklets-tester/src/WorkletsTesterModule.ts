import { requireOptionalNativeModule, NativeModule } from 'expo';

type SerializableRef<TValue = unknown> = {
  __serializableRef: true;
  __nativeStateSerializableJSRef: TValue;
};

declare class WorkletsTesterModule extends NativeModule {
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
