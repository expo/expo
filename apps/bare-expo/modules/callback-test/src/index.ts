import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

const CallbackTest = requireNativeModule('CallbackTest');

export function callWithInt(callback: (value: number) => void): void {
  CallbackTest.callWithInt(callback);
}

export function callMultiple(callback: (value: number) => void): void {
  CallbackTest.callMultiple(callback);
}

export function callWithRecord(
  callback: (progress: { percent: number; stage: string }) => void
): void {
  CallbackTest.callWithRecord(callback);
}

export function callWithEnum(callback: (stage: string) => void): void {
  CallbackTest.callWithEnum(callback);
}

export function greetWithCallback(name: string, callback: (greeting: string) => void): void {
  CallbackTest.greetWithCallback(name, callback);
}

export function simulateDownload(
  callback: (status: { stage: string; percent: number }) => void
): Promise<void> {
  return CallbackTest.simulateDownload(callback);
}

export const supportsJSMethod = Platform.OS === 'ios';

export function simulateDownloadJS(callback: (percent: number) => void): Promise<void> {
  return CallbackTest.simulateDownloadJS(callback);
}

export function callWithTwoCallbacks(
  onProgress: (percent: number) => void,
  onDone: (status: string) => void
): void {
  CallbackTest.callWithTwoCallbacks(onProgress, onDone);
}

export function callOptional(callback?: (value: string) => void): void {
  CallbackTest.callOptional(callback);
}

export function callWithArray(callback: (values: number[]) => void): void {
  CallbackTest.callWithArray(callback);
}

export function callWithMap(callback: (info: { name: string; version: number }) => void): void {
  CallbackTest.callWithMap(callback);
}

export function callWithMixedArgs(
  callback: (flag: boolean, num: number, text: string, list: string[]) => void
): void {
  CallbackTest.callWithMixedArgs(callback);
}

export function callWithNull(callback: (value: string | null) => void): void {
  CallbackTest.callWithNull(callback);
}

export function simulateDownloadWithResult(callback: (percent: number) => void): Promise<string> {
  return CallbackTest.simulateDownloadWithResult(callback);
}

export function callFromBackgroundThread(callback: (value: string) => void): void {
  CallbackTest.callFromBackgroundThread(callback);
}

export function callWithRecordAndCallback(
  options: { percent: number; stage: string },
  callback: (progress: { percent: number; stage: string }) => void
): void {
  CallbackTest.callWithRecordAndCallback(options, callback);
}
