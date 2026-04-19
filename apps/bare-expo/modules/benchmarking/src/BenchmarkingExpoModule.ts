import { requireNativeModule, NativeModule } from 'expo';

declare class BenchmarkingExpoModule extends NativeModule {
  nothing(): void;
  addNumbers(a: number, b: number): number;
  addNumbersOptimized(a: number, b: number): number;
  addStrings(a: string, b: string): string;
  foldArray(array: number[]): number;
  echoObject(point: { x: number; y: number }): { x: number; y: number };
  addNumbersAsync(a: number, b: number): Promise<number>;
  addNumbersAsyncOptimized(a: number, b: number): Promise<number>;
}

export default requireNativeModule<BenchmarkingExpoModule>('BenchmarkingExpoModule');
