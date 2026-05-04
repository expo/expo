import { BridgeModule, ExpoModule, TurboModule } from 'benchmarking';

import { BenchmarkRun } from './ModulesBenchmarksHistory';

const DEFAULT_ITERATIONS = 100_000;

export enum BenchmarkStatus {
  Idle = 'idle',
  Running = 'running',
  Done = 'done',
  Skipped = 'skipped',
}

export type Benchmark = {
  id: string;
  label: string;
  available: boolean;
  run: (iterations: number) => Promise<number>;
};

export type Group = {
  id: string;
  title: string;
  iterations?: number;
  benchmarks: Benchmark[];
};

export type CellState = {
  status: BenchmarkStatus;
  current: BenchmarkRun | null;
  previous: BenchmarkRun | null;
};

export type State = Record<string, CellState>;

export function iterationsOf(group: Group): number {
  return group.iterations ?? DEFAULT_ITERATIONS;
}

export function benchmarkIdOf(group: Group, benchmark: Benchmark): string {
  return `${group.id}:${benchmark.id}`;
}

function timeSync(iterations: number, fn: () => void): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return performance.now() - start;
}

async function timeAsync(
  iterations: number,
  fn: (iteration: number) => Promise<unknown>
): Promise<number> {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await fn(i);
  }
  return performance.now() - start;
}

export const GROUPS: Group[] = [
  {
    id: 'nothing',
    title: 'nothing()',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.nothing != null,
        async run(iterations) {
          ExpoModule.nothing();
          return timeSync(iterations, () => {
            ExpoModule.nothing();
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.nothing != null,
        async run(iterations) {
          TurboModule!.nothing();
          return timeSync(iterations, () => {
            TurboModule!.nothing();
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.nothing != null,
        async run(iterations) {
          BridgeModule.nothing();
          return timeSync(iterations, () => {
            BridgeModule.nothing();
          });
        },
      },
    ],
  },
  {
    id: 'addNumbers',
    title: 'addNumbers(a, b)',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.addNumbers != null,
        async run(iterations) {
          ExpoModule.addNumbers(0, 1);
          return timeSync(iterations, () => {
            ExpoModule.addNumbers(2, 5);
          });
        },
      },
      {
        id: 'expo-optimized',
        label: 'ExpoModule (optimized)',
        available: ExpoModule?.addNumbersOptimized != null,
        async run(iterations) {
          ExpoModule.addNumbersOptimized(0, 1);
          return timeSync(iterations, () => {
            ExpoModule.addNumbersOptimized(2, 5);
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.addNumbers != null,
        async run(iterations) {
          TurboModule!.addNumbers(0, 1);
          return timeSync(iterations, () => {
            TurboModule!.addNumbers(2, 5);
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.addNumbers != null,
        async run(iterations) {
          BridgeModule.addNumbers(0, 1);
          return timeSync(iterations, () => {
            BridgeModule.addNumbers(2, 5);
          });
        },
      },
    ],
  },
  {
    id: 'addNumbersAsync',
    title: 'addNumbersAsync(a, b)',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.addNumbersAsync != null,
        async run(iterations) {
          await ExpoModule.addNumbersAsync(0, 1);
          return timeAsync(iterations, (iteration) => {
            return ExpoModule.addNumbersAsync(iteration, 5);
          });
        },
      },
      {
        id: 'expo-optimized',
        label: 'ExpoModule (optimized)',
        available: ExpoModule?.addNumbersAsyncOptimized != null,
        async run(iterations) {
          await ExpoModule.addNumbersAsyncOptimized(0, 1);
          return timeAsync(iterations, (iteration) => {
            return ExpoModule.addNumbersAsyncOptimized(iteration, 5);
          });
        },
      },
    ],
  },
  {
    id: 'addStrings',
    title: 'addStrings(a, b)',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.addStrings != null,
        async run(iterations) {
          ExpoModule.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            ExpoModule.addStrings('hello ', 'world');
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.addStrings != null,
        async run(iterations) {
          TurboModule!.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            TurboModule!.addStrings('hello ', 'world');
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.addStrings != null,
        async run(iterations) {
          BridgeModule.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            BridgeModule.addStrings('hello ', 'world');
          });
        },
      },
    ],
  },
  {
    id: 'echoObject',
    title: 'echoObject({ x, y })',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.echoObject != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          ExpoModule.echoObject(point);
          return timeSync(iterations, () => {
            ExpoModule.echoObject(point);
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.echoObject != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          TurboModule!.echoObject(point);
          return timeSync(iterations, () => {
            TurboModule!.echoObject(point);
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.echoObject != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          BridgeModule.echoObject(point);
          return timeSync(iterations, () => {
            BridgeModule.echoObject(point);
          });
        },
      },
    ],
  },
  {
    id: 'foldArray',
    title: 'foldArray(numbers)',
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          ExpoModule.foldArray(numbers);
          return timeSync(iterations, () => {
            ExpoModule.foldArray(numbers);
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          TurboModule!.foldArray(numbers);
          return timeSync(iterations, () => {
            TurboModule!.foldArray(numbers);
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          BridgeModule.foldArray(numbers);
          return timeSync(iterations, () => {
            BridgeModule.foldArray(numbers);
          });
        },
      },
    ],
  },
];
