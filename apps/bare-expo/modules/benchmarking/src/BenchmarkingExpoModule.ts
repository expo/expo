import { requireNativeModule, NativeModule, SharedObject } from 'expo';

export declare class SharedPoint extends SharedObject {
  constructor(x: number, y: number);
  readonly x: number;
  readonly y: number;
}

declare class BenchmarkingExpoModule extends NativeModule {
  nothing(): void;
  nothingOptimized(): void;
  nothingAsync(): Promise<void>;
  addNumbers(a: number, b: number): number;
  addNumbersOptimized(a: number, b: number): number;
  addStrings(a: string, b: string): string;
  addStringsOptimized(a: string, b: string): string;
  foldArray(array: number[]): number;
  passthroughDict(point: { x: number; y: number }): { x: number; y: number };
  passthroughRecord(point: { x: number; y: number }): { x: number; y: number };
  passthroughSharedObject(point: SharedPoint): SharedPoint;
  SharedPoint: typeof SharedPoint;
  addNumbersAsync(a: number, b: number): Promise<number>;
  addNumbersAsyncOptimized(a: number, b: number): Promise<number>;
}

export default requireNativeModule<BenchmarkingExpoModule>('BenchmarkingExpoModule');
