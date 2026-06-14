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

  // MARK: - View-props benchmark (iOS only)

  /** Resets the process-wide view-prop decode/apply counters. */
  resetViewPropsBenchmark(): void;
  /** Reads the accumulated view-prop decode/apply counters. */
  getViewPropsBenchmark(): ViewPropsBenchmark;
}

export type ViewPropsBenchmark = {
  /** Total time spent decoding props from JS values on the JS thread (ms). */
  decodeMs: number;
  /** Total time spent applying props to views on the main thread (ms). */
  applyMs: number;
  /** Number of props decoded straight from their JS value (JSI path). */
  decodedPropCount: number;
  /** Number of props presented to the legacy (dictionary) path (sticky full set, not applied count). */
  legacyPresentedPropCount: number;
  /** Number of decode passes (cloneProps calls that reached the decoder; can exceed apply passes). */
  decodePassCount: number;
  /** Number of apply passes (finalizeUpdates → updateProps calls on the main thread). */
  applyPassCount: number;
};

export default requireNativeModule<BenchmarkingExpoModule>('BenchmarkingExpoModule');
