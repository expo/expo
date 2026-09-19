import { BridgeModule, ExpoModule, TurboModule } from 'benchmarking';

// Metro compiles each re-export into a `defineProperty` getter, so reading `ExpoModule` inside a
// timed loop costs two getter calls per iteration before the native call even starts. Resolving
// the modules once here keeps that cost out of the measurements.
const expoModule = ExpoModule;
const turboModule = TurboModule;
const bridgeModule = BridgeModule;

import { BenchmarkRun } from './ModulesBenchmarksHistory';

/**
 * Target duration of a single timed series. Iterations are calibrated per benchmark to
 * land near this, so a 400 ns call and a 25 µs call both run long enough that scheduler
 * noise and a stray GC stop dominating the sample.
 */
const TARGET_SERIES_MS = 200;

/**
 * Sampling stops once a benchmark has spent this long in timed series, so a run costs
 * roughly the same wall time whatever the benchmark does.
 */
const SERIES_BUDGET_MS = 2_000;

/** Sampling never stops below this many series, whatever the budget or the precision says. */
export const MIN_SERIES = 5;

/** Nor does it continue past this many, so one pathological benchmark can't stall a run. */
export const MAX_SERIES = 25;

/**
 * Sampling stops early once the confidence interval is this tight relative to the median.
 * Spending more series on an already-precise benchmark buys nothing.
 */
const PRECISION_TARGET = 0.01;

/** Resamples used for the bootstrap confidence interval of the median. */
const BOOTSTRAP_RESAMPLES = 1_000;

/** Iteration count of the first calibration probe. */
const PROBE_ITERATIONS = 1_000;

/** A probe shorter than this is too close to timer resolution to extrapolate from. */
const MIN_PROBE_MS = 5;

const MIN_ITERATIONS = 100;
const MAX_ITERATIONS = 2_000_000;

/**
 * Cooldown before every timed series. Series are interleaved across the benchmarks of a
 * group, so consecutive series always belong to different benchmarks and this separates
 * both.
 */
const COOLDOWN_MS = 200;

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
  description?: string;
  benchmarks: Benchmark[];
};

export type CellState = {
  status: BenchmarkStatus;
  current: BenchmarkRun | null;
  previous: BenchmarkRun | null;
  /** Calibrated iteration count, available once the group has been calibrated. */
  iterations: number | null;
  /** Series finished so far, reset when the group starts. Only meaningful while running. */
  completedSeries: number;
};

export type State = Record<string, CellState>;

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    return setTimeout(resolve, ms);
  });
}

/** Pause between series, long enough to let the UI paint and the runtime settle. */
export function cooldown(): Promise<void> {
  return delay(COOLDOWN_MS);
}

/**
 * Picks an iteration count that makes one series last about `TARGET_SERIES_MS`, by probing
 * the benchmark and scaling up until the probe is long enough to extrapolate from. Comparing
 * benchmarks at a fixed iteration count is what made the fast ones noise-dominated, so every
 * benchmark gets its own count and results are compared per operation.
 */
export async function calibrate(benchmark: Benchmark): Promise<number> {
  let iterations = PROBE_ITERATIONS;
  let elapsed = await benchmark.run(iterations);

  while (elapsed < MIN_PROBE_MS && iterations < MAX_ITERATIONS) {
    iterations = Math.min(MAX_ITERATIONS, iterations * 10);
    elapsed = await benchmark.run(iterations);
  }

  if (elapsed <= 0) {
    return MAX_ITERATIONS;
  }
  return iterationsForTarget(iterations, elapsed);
}

/** Scales an iteration count so that a series taking `elapsed` would instead take the target. */
function iterationsForTarget(iterations: number, elapsed: number): number {
  const scaled = Math.round((iterations * TARGET_SERIES_MS) / elapsed);
  return Math.min(MAX_ITERATIONS, Math.max(MIN_ITERATIONS, scaled));
}

/**
 * Runs one full-length series so the first timed series is not the one that pays for cold code
 * paths and lazily allocated buffers, and returns a refined iteration count. The calibration
 * probe runs cold and tends to overestimate the per-call cost, which leaves series well short
 * of the target; this run is warm, so its timing is the better basis.
 */
export async function warmUpAndRefine(benchmark: Benchmark, iterations: number): Promise<number> {
  const elapsed = await benchmark.run(iterations);
  if (elapsed <= 0) {
    return iterations;
  }
  return iterationsForTarget(iterations, elapsed);
}

/** Runs and times a single series. */
export function timeSeries(benchmark: Benchmark, iterations: number): Promise<number> {
  return benchmark.run(iterations);
}

function medianOf(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/**
 * Percentile bootstrap confidence interval for the median: resample the series with
 * replacement, take the median of each resample, and cut the middle 95% of those. Unlike the
 * min–max range it says how well the samples pin down the median, which is the number the
 * screen compares.
 */
function bootstrapMedianCi(samples: number[]): { lowMs: number; highMs: number } {
  const medians: number[] = [];
  const resample: number[] = new Array(samples.length);
  for (let index = 0; index < BOOTSTRAP_RESAMPLES; index++) {
    for (let pick = 0; pick < samples.length; pick++) {
      resample[pick] = samples[Math.floor(Math.random() * samples.length)];
    }
    medians.push(
      medianOf(
        [...resample].sort((a, b) => {
          return a - b;
        })
      )
    );
  }
  medians.sort((a, b) => {
    return a - b;
  });
  return {
    lowMs: medians[Math.floor(medians.length * 0.025)],
    highMs: medians[Math.ceil(medians.length * 0.975) - 1],
  };
}

/** Summarizes the timed series of one benchmark. `samples` must not be empty. */
export function summarize(samples: number[], iterations: number): BenchmarkRun {
  const sorted = [...samples].sort((a, b) => {
    return a - b;
  });
  const total = samples.reduce((sum, sample) => {
    return sum + sample;
  }, 0);
  const { lowMs, highMs } = bootstrapMedianCi(samples);

  return {
    medianMs: medianOf(sorted),
    meanMs: total / samples.length,
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    ciLowMs: lowMs,
    ciHighMs: highMs,
    samples,
    iterations,
    runAt: Date.now(),
  };
}

/**
 * Whether a benchmark has been sampled enough: past the time budget, precise enough, or at
 * the hard cap. Below `MIN_SERIES` the answer is always no.
 */
export function hasEnoughSamples(samples: number[]): boolean {
  if (samples.length < MIN_SERIES) {
    return false;
  }
  if (samples.length >= MAX_SERIES) {
    return true;
  }
  const spent = samples.reduce((sum, sample) => {
    return sum + sample;
  }, 0);
  if (spent >= SERIES_BUDGET_MS) {
    return true;
  }
  return relativeUncertaintyOf(summarize(samples, 1)) <= PRECISION_TARGET;
}

/**
 * Cost of a single call in nanoseconds. Iteration counts are calibrated per benchmark, so
 * this is the only unit that compares across rows.
 */
export function nsPerOp(ms: number, iterations: number): number {
  return (ms * 1e6) / iterations;
}

export type PerOpUnit = {
  suffix: string;
  divisor: number;
  decimals: number;
};

/**
 * Picks one unit for a whole group, anchored on its fastest benchmark. Every value of the
 * group is then printed in that unit, so rows can be compared without reading suffixes.
 */
export function perOpUnitFor(fastestNs: number): PerOpUnit {
  const { suffix, divisor } =
    fastestNs < 1_000
      ? { suffix: 'ns', divisor: 1 }
      : fastestNs < 1_000_000
        ? { suffix: 'µs', divisor: 1_000 }
        : { suffix: 'ms', divisor: 1_000_000 };
  return { suffix, divisor, decimals: fastestNs / divisor >= 100 ? 0 : 2 };
}

/** Formats a per-call cost in the given unit, without the suffix. */
export function formatPerOpIn(ns: number, unit: PerOpUnit): string {
  return (ns / unit.divisor).toFixed(unit.decimals);
}

/** Formats a per-call cost with its own unit. For values shown outside a group's scale. */
export function formatPerOp(ns: number): string {
  const unit = perOpUnitFor(ns);
  return `${formatPerOpIn(ns, unit)} ${unit.suffix}`;
}

/** Formats a calibrated iteration count, e.g. `680k`. */
export function formatIterations(iterations: number): string {
  if (iterations >= 1_000_000) {
    return `${(iterations / 1_000_000).toFixed(1)}M`;
  }
  if (iterations >= 1_000) {
    return `${Math.round(iterations / 1_000)}k`;
  }
  return `${iterations}`;
}

/**
 * Half-width of the confidence interval as a fraction of the median, i.e. the `±` on the
 * headline value. Above a couple of percent, differences smaller than that mean nothing.
 */
export function relativeUncertaintyOf(run: BenchmarkRun): number {
  if (run.medianMs <= 0) {
    return 0;
  }
  return (run.ciHighMs - run.ciLowMs) / 2 / run.medianMs;
}

const TICK_INTERVAL_MS = 16;

// Wraps a benchmark to log JS-thread responsiveness during the run. Schedules a
// `setInterval` tick and compares the actual tick count against the expected
// count for the elapsed wall time. Ratio ≈ 1.0 means the JS thread stayed
// responsive; lower means it was blocked.
function withResponsiveness(
  label: string,
  run: (iterations: number) => Promise<number>
): (iterations: number) => Promise<number> {
  return async (iterations) => {
    let ticks = 0;
    const handle = setInterval(() => {
      ticks++;
    }, TICK_INTERVAL_MS);
    const start = performance.now();
    try {
      const elapsed = await run(iterations);
      const expectedTicks = (performance.now() - start) / TICK_INTERVAL_MS;

      if (expectedTicks < 5) {
        console.log(
          `[benchmark: ${label}] JS responsiveness: skipped (run too short, ${expectedTicks.toFixed(1)} expected ticks)`
        );
      } else {
        const ratio = ticks / expectedTicks;
        console.log(
          `[benchmark: ${label}] JS responsiveness: ${ratio.toFixed(2)} (${ticks}/${expectedTicks.toFixed(0)} ticks)`
        );
      }
      return elapsed;
    } finally {
      clearInterval(handle);
    }
  };
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
        label: 'Function',
        available: expoModule?.nothing != null,
        async run(iterations) {
          expoModule.nothing();
          return timeSync(iterations, () => {
            expoModule.nothing();
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.nothingSynthesized != null,
        async run(iterations) {
          expoModule.nothingSynthesized();
          return timeSync(iterations, () => {
            expoModule.nothingSynthesized();
          });
        },
      },
      {
        id: 'expo-optimized',
        label: '@OptimizedFunction',
        available: expoModule?.nothingOptimized != null,
        async run(iterations) {
          expoModule.nothingOptimized();
          return timeSync(iterations, () => {
            expoModule.nothingOptimized();
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: turboModule?.nothing != null,
        async run(iterations) {
          turboModule!.nothing();
          return timeSync(iterations, () => {
            turboModule!.nothing();
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: bridgeModule?.nothing != null,
        async run(iterations) {
          bridgeModule.nothing();
          return timeSync(iterations, () => {
            bridgeModule.nothing();
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
    benchmarks: [
      {
        id: 'expo',
        label: 'AsyncFunction',
        available: expoModule?.nothingAsync != null,
        async run(iterations) {
          await expoModule.nothingAsync();
          return timeAsync(iterations, () => {
            return expoModule.nothingAsync();
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.nothingAsyncSynthesized != null,
        async run(iterations) {
          await expoModule.nothingAsyncSynthesized();
          return timeAsync(iterations, () => {
            return expoModule.nothingAsyncSynthesized();
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: turboModule?.nothingAsync != null,
        async run(iterations) {
          await turboModule!.nothingAsync();
          return timeAsync(iterations, () => {
            return turboModule!.nothingAsync();
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: bridgeModule?.nothingAsync != null,
        async run(iterations) {
          await bridgeModule.nothingAsync();
          return timeAsync(iterations, () => {
            return bridgeModule.nothingAsync();
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
        label: 'Function',
        available: expoModule?.addNumbers != null,
        async run(iterations) {
          expoModule.addNumbers(0, 1);
          return timeSync(iterations, () => {
            expoModule.addNumbers(2, 5);
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.addNumbersSynthesized != null,
        async run(iterations) {
          expoModule.addNumbersSynthesized(0, 1);
          return timeSync(iterations, () => {
            expoModule.addNumbersSynthesized(2, 5);
          });
        },
      },
      {
        id: 'expo-optimized',
        label: '@OptimizedFunction',
        available: expoModule?.addNumbersOptimized != null,
        async run(iterations) {
          expoModule.addNumbersOptimized(0, 1);
          return timeSync(iterations, () => {
            expoModule.addNumbersOptimized(2, 5);
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: turboModule?.addNumbers != null,
        async run(iterations) {
          turboModule!.addNumbers(0, 1);
          return timeSync(iterations, () => {
            turboModule!.addNumbers(2, 5);
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: bridgeModule?.addNumbers != null,
        async run(iterations) {
          bridgeModule.addNumbers(0, 1);
          return timeSync(iterations, () => {
            bridgeModule.addNumbers(2, 5);
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
    benchmarks: [
      {
        id: 'expo',
        label: 'AsyncFunction',
        available: expoModule?.addNumbersAsync != null,
        async run(iterations) {
          await expoModule.addNumbersAsync(0, 1);
          return timeAsync(iterations, (iteration) => {
            return expoModule.addNumbersAsync(iteration, 5);
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.addNumbersAsyncSynthesized != null,
        async run(iterations) {
          await expoModule.addNumbersAsyncSynthesized(0, 1);
          return timeAsync(iterations, (iteration) => {
            return expoModule.addNumbersAsyncSynthesized(iteration, 5);
          });
        },
      },
      {
        id: 'expo-optimized',
        label: '@OptimizedFunction',
        available: expoModule?.addNumbersAsyncOptimized != null,
        async run(iterations) {
          await expoModule.addNumbersAsyncOptimized(0, 1);
          return timeAsync(iterations, (iteration) => {
            return expoModule.addNumbersAsyncOptimized(iteration, 5);
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
        label: 'Function',
        available: expoModule?.addStrings != null,
        async run(iterations) {
          expoModule.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            expoModule.addStrings('hello ', 'world');
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.addStringsSynthesized != null,
        async run(iterations) {
          expoModule.addStringsSynthesized('hello ', 'world');
          return timeSync(iterations, () => {
            expoModule.addStringsSynthesized('hello ', 'world');
          });
        },
      },
      {
        id: 'expo-optimized',
        label: '@OptimizedFunction',
        available: expoModule?.addStringsOptimized != null,
        async run(iterations) {
          expoModule.addStringsOptimized('hello ', 'world');
          return timeSync(iterations, () => {
            expoModule.addStringsOptimized('hello ', 'world');
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: turboModule?.addStrings != null,
        async run(iterations) {
          turboModule!.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            turboModule!.addStrings('hello ', 'world');
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: bridgeModule?.addStrings != null,
        async run(iterations) {
          bridgeModule.addStrings('hello ', 'world');
          return timeSync(iterations, () => {
            bridgeModule.addStrings('hello ', 'world');
          });
        },
      },
    ],
  },
  {
    id: 'addStringsAsync',
    title: 'addStringsAsync(a, b)',
    description:
      'Asynchronous variant of `addStrings`. Adds Promise allocation/resolution on top of the string conversion cost and stresses how arguments cross the asynchronous boundary. Only Expo Module is implemented — no Turbo or Bridge counterpart.',
    benchmarks: [
      {
        id: 'expo',
        label: 'AsyncFunction',
        available: expoModule?.addStringsAsync != null,
        async run(iterations) {
          await expoModule.addStringsAsync('hello ', 'world');
          return timeAsync(iterations, () => {
            return expoModule.addStringsAsync('hello ', 'world');
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.addStringsAsyncSynthesized != null,
        async run(iterations) {
          await expoModule.addStringsAsyncSynthesized('hello ', 'world');
          return timeAsync(iterations, () => {
            return expoModule.addStringsAsyncSynthesized('hello ', 'world');
          });
        },
      },
    ],
  },
  {
    id: 'passthrough',
    title: 'passthrough({ x, y })',
    description:
      'Synchronous round-trip of a 2D point represented in four different ways. Compares `[String: Any]` dictionary, `Record`, `@Record`-synthesized record, and `SharedObject` decoding/encoding within Expo Modules. TurboModule and BridgeModule provide a dictionary baseline.',
    benchmarks: [
      {
        id: 'expo-dict',
        label: 'Dictionary',
        available: expoModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          expoModule.passthroughDict(point);
          return timeSync(iterations, () => {
            expoModule.passthroughDict(point);
          });
        },
      },
      {
        id: 'expo-record',
        label: 'Record + @Field',
        available: expoModule?.passthroughRecord != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          expoModule.passthroughRecord(point);
          return timeSync(iterations, () => {
            expoModule.passthroughRecord(point);
          });
        },
      },
      {
        id: 'expo-synthesized-record',
        label: '@Record + @ExpoModule',
        available: expoModule?.passthroughSynthesizedRecord != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          expoModule.passthroughSynthesizedRecord(point);
          return timeSync(iterations, () => {
            expoModule.passthroughSynthesizedRecord(point);
          });
        },
      },
      {
        id: 'expo-shared',
        label: 'SharedObject',
        available: expoModule?.passthroughSharedObject != null && expoModule?.SharedPoint != null,
        async run(iterations) {
          const point = new expoModule.SharedPoint(1.5, 2.5);
          expoModule.passthroughSharedObject(point);
          return timeSync(iterations, () => {
            expoModule.passthroughSharedObject(point);
          });
        },
      },
      {
        id: 'turbo-dict',
        label: 'Dictionary (TurboModule)',
        available: turboModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          turboModule!.passthroughDict(point);
          return timeSync(iterations, () => {
            turboModule!.passthroughDict(point);
          });
        },
      },
      {
        id: 'bridge-dict',
        label: 'Dictionary (BridgeModule)',
        available: bridgeModule?.passthroughDict != null,
        async run(iterations) {
          const point = { x: 1.5, y: 2.5 };
          bridgeModule.passthroughDict(point);
          return timeSync(iterations, () => {
            bridgeModule.passthroughDict(point);
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
        label: 'Function',
        available: expoModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          expoModule.foldArray(numbers);
          return timeSync(iterations, () => {
            expoModule.foldArray(numbers);
          });
        },
      },
      {
        id: 'expo-synthesized',
        label: '@JS',
        available: expoModule?.foldArraySynthesized != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          expoModule.foldArraySynthesized(numbers);
          return timeSync(iterations, () => {
            expoModule.foldArraySynthesized(numbers);
          });
        },
      },
      {
        id: 'turbo',
        label: 'TurboModule',
        available: turboModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          turboModule!.foldArray(numbers);
          return timeSync(iterations, () => {
            turboModule!.foldArray(numbers);
          });
        },
      },
      {
        id: 'bridge',
        label: 'BridgeModule',
        available: bridgeModule?.foldArray != null,
        async run(iterations) {
          const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          bridgeModule.foldArray(numbers);
          return timeSync(iterations, () => {
            bridgeModule.foldArray(numbers);
          });
        },
      },
    ],
  },
  {
    id: 'runtimeExecute',
    title: 'runtime.execute() — iOS',
    description:
      'Round-trips `runtime.execute(...)` from a non-JS caller, calling `runtime.global().hasProperty("Math")` inside the closure.\n' +
      'The JS thread should stay responsive across all four overloads (ratio logged to the console).',
    benchmarks: [
      {
        id: 'blocking-sync',
        label: 'blocking caller, sync closure',
        available: expoModule?.executeBlockingSync != null,
        run: withResponsiveness('executeBlockingSync', (iterations) =>
          expoModule.executeBlockingSync(iterations)
        ),
      },
      {
        id: 'blocking-async',
        label: 'blocking caller, async closure',
        available: expoModule?.executeBlockingAsync != null,
        run: withResponsiveness('executeBlockingAsync', (iterations) =>
          expoModule.executeBlockingAsync(iterations)
        ),
      },
      {
        id: 'async-sync',
        label: 'async caller, sync closure',
        available: expoModule?.executeAsyncSync != null,
        run: withResponsiveness('executeAsyncSync', (iterations) =>
          expoModule.executeAsyncSync(iterations)
        ),
      },
      {
        id: 'async-async',
        label: 'async caller, async closure',
        available: expoModule?.executeAsyncAsync != null,
        run: withResponsiveness('executeAsyncAsync', (iterations) =>
          expoModule.executeAsyncAsync(iterations)
        ),
      },
    ],
  },
];
