import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  nothing(): number;
  addNumbers(a: number, b: number): number;
  asyncAddNumbers(a: number, b: number): Promise<number>;
  addStrings(a: string, b: string): string;
  foldArray(array: number[]): number;
}

export default TurboModuleRegistry.get<Spec>('BenchmarkingTurboModule') as Spec | null;
