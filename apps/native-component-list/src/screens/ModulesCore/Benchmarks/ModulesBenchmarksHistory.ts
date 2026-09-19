import AsyncStorage from '@react-native-async-storage/async-storage';

export type BenchmarkRun = {
  /** Median of `samples`. The headline value, robust to a single noisy series. */
  medianMs: number;
  /** Arithmetic mean of `samples`. Sensitive to outliers, so compare it against the median. */
  meanMs: number;
  /** Fastest series. */
  minMs: number;
  /** Slowest series. */
  maxMs: number;
  /** Bounds of the 95% bootstrap confidence interval for the median. */
  ciLowMs: number;
  ciHighMs: number;
  /** Duration of each timed series, in run order. Never empty. */
  samples: number[];
  /** Iterations executed within a single series. */
  iterations: number;
  runAt: number;
};

export interface BenchmarkHistoryStore {
  getPrevious(benchmarkId: string): Promise<BenchmarkRun | null>;
  savePrevious(benchmarkId: string, run: BenchmarkRun): Promise<void>;
  clearAll(): Promise<void>;
}

// Bumped whenever the measurement protocol changes, so results produced by an older
// protocol are dropped instead of being compared against current ones.
const STORAGE_KEY_PREFIX = 'ncl:modules-benchmarks:v4:';

function isBenchmarkRun(value: any): value is BenchmarkRun {
  return (
    typeof value?.medianMs === 'number' &&
    typeof value?.meanMs === 'number' &&
    typeof value?.minMs === 'number' &&
    typeof value?.maxMs === 'number' &&
    typeof value?.ciLowMs === 'number' &&
    typeof value?.ciHighMs === 'number' &&
    typeof value?.iterations === 'number' &&
    typeof value?.runAt === 'number' &&
    Array.isArray(value?.samples) &&
    value.samples.length > 0 &&
    value.samples.every((sample: unknown) => {
      return typeof sample === 'number';
    })
  );
}

class AsyncStorageBenchmarkHistoryStore implements BenchmarkHistoryStore {
  async getPrevious(benchmarkId: string): Promise<BenchmarkRun | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + benchmarkId);
    if (raw == null) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      return isBenchmarkRun(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  async savePrevious(benchmarkId: string, run: BenchmarkRun): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY_PREFIX + benchmarkId, JSON.stringify(run));
  }

  async clearAll(): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToRemove = allKeys.filter((key) => {
      return key.startsWith(STORAGE_KEY_PREFIX);
    });
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  }
}

export const benchmarkHistoryStore: BenchmarkHistoryStore = new AsyncStorageBenchmarkHistoryStore();
