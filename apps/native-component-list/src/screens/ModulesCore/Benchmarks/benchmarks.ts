import { BridgeModule, ExpoModule, TurboModule } from 'benchmarking';
import { Platform } from 'react-native';

import { BenchmarkRun } from './ModulesBenchmarksHistory';

const DEFAULT_ITERATIONS = 100_000;
const DEFAULT_ASYNC_ITERATIONS = Platform.OS === 'ios' ? DEFAULT_ITERATIONS : 25_000;

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
  description?: string;
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
    description:
      'Synchronous no-op host function. Measures the raw JS↔native boundary cost with no arguments and no return value.',
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
    id: 'nothingAsync',
    title: 'nothingAsync()',
    description:
      'Asynchronous no-op host function. Each iteration `await`s a Promise that resolves on the JS thread, so it measures Promise allocation and resolution on top of the boundary cost.',
    iterations: DEFAULT_ASYNC_ITERATIONS,
    benchmarks: [
      {
        id: 'expo',
        label: 'ExpoModule',
        available: ExpoModule?.nothingAsync != null,
        async run(iterations) {
          await ExpoModule.nothingAsync();
          return timeAsync(iterations, () => {
            return ExpoModule.nothingAsync();
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: TurboModule?.nothingAsync != null,
        async run(iterations) {
          await TurboModule!.nothingAsync();
          return timeAsync(iterations, () => {
            return TurboModule!.nothingAsync();
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: BridgeModule?.nothingAsync != null,
        async run(iterations) {
          await BridgeModule.nothingAsync();
          return timeAsync(iterations, () => {
            return BridgeModule.nothingAsync();
          });
        },
      },
    ],
  },
  {
    id: 'addNumbers',
    title: 'addNumbers(a, b)',
    description:
      'Synchronous call with two `Double` arguments returning a `Double`. Stresses argument coercion and primitive return — the closest analogue to a typical JSI host function.',
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
    description:
      'Asynchronous variant of `addNumbers`. Adds Promise allocation/resolution on top of the argument coercion overhead. Only Expo Module is implemented — no Turbo or Bridge counterpart.',
    iterations: DEFAULT_ASYNC_ITERATIONS,
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
    description:
      'Synchronous call with two short `String` arguments returning a concatenated `String`. Highlights JSI string conversion, UTF decoding, and Swift `String` allocation cost.',
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
    id: 'passthrough',
    title: 'passthrough({ x, y })',
    description:
      'Synchronous round-trip of a 2D point represented in three different ways. Compares `[String: Any]` dictionary, `Record`, and `SharedObject` decoding/encoding within Expo Modules. TurboModule and BridgeModule provide a dictionary baseline.',
    benchmarks: [
      {
        id: 'expo-dict',
        label: 'ExpoModule (dictionary)',
        available: ExpoModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          ExpoModule.passthroughDict(point);
          return timeSync(iterations, () => {
            ExpoModule.passthroughDict(point);
          });
        },
      },
      {
        id: 'expo-record',
        label: 'ExpoModule (record)',
        available: ExpoModule?.passthroughRecord != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          ExpoModule.passthroughRecord(point);
          return timeSync(iterations, () => {
            ExpoModule.passthroughRecord(point);
          });
        },
      },
      {
        id: 'expo-shared',
        label: 'ExpoModule (shared object)',
        available: ExpoModule?.passthroughSharedObject != null && ExpoModule?.SharedPoint != null,
        async run(iterations) {
          const point = new ExpoModule.SharedPoint(1.5, 2.5);
          ExpoModule.passthroughSharedObject(point);
          return timeSync(iterations, () => {
            ExpoModule.passthroughSharedObject(point);
          });
        },
      },
      {
        id: 'turbo-dict',
        label: 'TurboModule (dictionary)',
        available: TurboModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          TurboModule!.passthroughDict(point);
          return timeSync(iterations, () => {
            TurboModule!.passthroughDict(point);
          });
        },
      },
      {
        id: 'bridge-dict',
        label: 'BridgeModule (dictionary)',
        available: BridgeModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          BridgeModule.passthroughDict(point);
          return timeSync(iterations, () => {
            BridgeModule.passthroughDict(point);
          });
        },
      },
    ],
  },
  {
    id: 'foldArray',
    title: 'foldArray(numbers)',
    description:
      'Synchronous call with a 10-element `Double` array, returning the sum. Measures array decoding from JS, including per-element coercion.',
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
