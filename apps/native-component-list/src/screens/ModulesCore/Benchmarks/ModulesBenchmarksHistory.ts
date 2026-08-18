import AsyncStorage from '@react-native-async-storage/async-storage';

export type BenchmarkRun = {
  timeMs: number;
  iterations: number;
  runAt: number;
};

export interface BenchmarkHistoryStore {
  getPrevious(benchmarkId: string): Promise<BenchmarkRun | null>;
  savePrevious(benchmarkId: string, run: BenchmarkRun): Promise<void>;
  clearAll(): Promise<void>;
}

const STORAGE_KEY_PREFIX = 'ncl:modules-benchmarks:v1:';

class AsyncStorageBenchmarkHistoryStore implements BenchmarkHistoryStore {
  async getPrevious(benchmarkId: string): Promise<BenchmarkRun | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PREFIX + benchmarkId);
    if (raw == null) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.timeMs === 'number' &&
        typeof parsed?.iterations === 'number' &&
        typeof parsed?.runAt === 'number'
      ) {
        return parsed as BenchmarkRun;
      }
      return null;
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
