import { requireNativeModule, NativeModule } from 'expo';

declare class BenchmarkingExpoModule extends NativeModule {
  nothing(): void;
  addNumbers(a: number, b: number): number;
  addStrings(a: string, b: string): string;
}

export default requireNativeModule<BenchmarkingExpoModule>('BenchmarkingExpoModule');
