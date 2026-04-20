import { requireNativeModule } from 'expo-modules-core';
import type { Callback } from 'expo-modules-core';

const CallbackTest = requireNativeModule('CallbackTest');

export function callWithInt(callback: Callback<[value: number]>): void {
  CallbackTest.callWithInt(callback);
}

export function callMultiple(callback: Callback<[value: number]>): void {
  CallbackTest.callMultiple(callback);
}

export function callWithRecord(
  callback: Callback<[progress: { percent: number; stage: string }]>
): void {
  CallbackTest.callWithRecord(callback);
}

export function callWithEnum(callback: Callback<[stage: string]>): void {
  CallbackTest.callWithEnum(callback);
}

export function simulateDownload(
  callback: Callback<[status: { stage: string; percent: number }]>
): void {
  CallbackTest.simulateDownload(callback);
}

export function greetWithCallback(name: string, callback: Callback<[greeting: string]>): void {
  CallbackTest.greetWithCallback(name, callback);
}
