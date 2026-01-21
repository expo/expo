import { useReleasingSharedObject } from 'expo-modules-core';
import { SharedObject } from 'expo';

import NativeExpoUIModule from '../NativeExpoUIModule';

export declare class NativeStateString extends SharedObject<{}> {
  constructor(initialValue?: string);
  value: string;
}

export declare class NativeStateDouble extends SharedObject<{}> {
  constructor(initialValue?: number);
  value: number;
}

export declare class NativeStateBool extends SharedObject<{}> {
  constructor(initialValue?: boolean);
  value: boolean;
}

export function useNativeStateString(initialValue?: string): NativeStateString {
  return useReleasingSharedObject(() => {
    return new NativeExpoUIModule.NativeStateString(initialValue);
  }, [initialValue]);
}

export function useNativeStateDouble(initialValue?: number): NativeStateDouble {
  return useReleasingSharedObject(() => {
    return new NativeExpoUIModule.NativeStateDouble(initialValue);
  }, [initialValue]);
}

export function useNativeStateBool(initialValue?: boolean): NativeStateBool {
  return useReleasingSharedObject(() => {
    return new NativeExpoUIModule.NativeStateBool(initialValue);
  }, [initialValue]);
}
