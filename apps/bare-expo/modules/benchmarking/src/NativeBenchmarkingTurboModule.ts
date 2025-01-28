import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  nothing(): void;
  addNumbers(a: number, b: number): number;
  addStrings(a: string, b: string): string;
  foldArray(array: number[]): number;
}

export default TurboModuleRegistry.get<Spec>('BenchmarkingTurboModule') as Spec | null;
