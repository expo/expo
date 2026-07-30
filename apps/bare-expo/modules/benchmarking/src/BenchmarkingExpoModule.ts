import { requireNativeModule, NativeModule, SharedObject } from 'expo';

export declare class SharedPoint extends SharedObject {
  constructor(x: number, y: number);
  readonly x: number;
  readonly y: number;
}

declare class BenchmarkingExpoModule extends NativeModule {
  nothing(): void;
  nothingSynthesized(): void;
  nothingOptimized(): void;
  nothingAsync(): Promise<void>;
  nothingAsyncSynthesized(): Promise<void>;
  addNumbers(a: number, b: number): number;
  addNumbersSynthesized(a: number, b: number): number;
  addNumbersOptimized(a: number, b: number): number;
  addStrings(a: string, b: string): string;
  addStringsSynthesized(a: string, b: string): string;
  addStringsOptimized(a: string, b: string): string;
  addStringsAsync(a: string, b: string): Promise<string>;
  addStringsAsyncSynthesized(a: string, b: string): Promise<string>;
  foldArray(array: number[]): number;
  foldArraySynthesized(array: number[]): number;
  passthroughDict(point: { x: number; y: number }): { x: number; y: number };
  passthroughRecord(point: { x: number; y: number }): { x: number; y: number };
  passthroughSynthesizedRecord(point: { x: number; y: number }): { x: number; y: number };
  passthroughSharedObject(point: SharedPoint): SharedPoint;
  SharedPoint: typeof SharedPoint;
  addNumbersAsync(a: number, b: number): Promise<number>;
  addNumbersAsyncSynthesized(a: number, b: number): Promise<number>;
  addNumbersAsyncOptimized(a: number, b: number): Promise<number>;
  /** iOS only — measures blocking `runtime.execute` with a sync closure. */
  executeBlockingSync(iterations: number): Promise<number>;
  /** iOS only — measures blocking `runtime.execute` with an async closure. */
  executeBlockingAsync(iterations: number): Promise<number>;
  /** iOS only — measures async `runtime.execute` with a sync closure. */
  executeAsyncSync(iterations: number): Promise<number>;
  /** iOS only — measures async `runtime.execute` with an async closure. */
  executeAsyncAsync(iterations: number): Promise<number>;
}

export default requireNativeModule<BenchmarkingExpoModule>('BenchmarkingExpoModule');
