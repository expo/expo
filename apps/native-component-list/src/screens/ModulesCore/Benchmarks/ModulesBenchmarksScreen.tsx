import { useTheme } from 'ThemeProvider';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BenchmarkTable } from './BenchmarksTable';
import { BenchmarkRun, benchmarkHistoryStore } from './ModulesBenchmarksHistory';
import {
  Benchmark,
  BenchmarkStatus,
  GROUPS,
  Group,
  State,
  benchmarkIdOf,
  iterationsOf,
} from './benchmarks';

enum ActionType {
  SetPrevious = 'setPrevious',
  MarkRunning = 'markRunning',
  MarkDone = 'markDone',
  MarkSkipped = 'markSkipped',
  ResetGroup = 'resetGroup',
  ClearAll = 'clearAll',
}

type Action =
  | { type: ActionType.SetPrevious; benchmarkId: string; previous: BenchmarkRun | null }
  | { type: ActionType.MarkRunning; benchmarkId: string }
  | { type: ActionType.MarkDone; benchmarkId: string; run: BenchmarkRun }
  | { type: ActionType.MarkSkipped; benchmarkId: string }
  | { type: ActionType.ResetGroup; groupId: string }
  | { type: ActionType.ClearAll };

function initialState(): State {
  const state: State = {};
  for (const group of GROUPS) {
    for (const benchmark of group.benchmarks) {
      state[benchmarkIdOf(group, benchmark)] = {
        status: benchmark.available ? BenchmarkStatus.Idle : BenchmarkStatus.Skipped,
        current: null,
        previous: null,
      };
    }
  }
  return state;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.SetPrevious:
      return {
        ...state,
        [action.benchmarkId]: { ...state[action.benchmarkId], previous: action.previous },
      };
    case ActionType.MarkRunning:
      return {
        ...state,
        [action.benchmarkId]: {
          ...state[action.benchmarkId],
          status: BenchmarkStatus.Running,
        },
      };
    case ActionType.MarkDone: {
      const existing = state[action.benchmarkId];
      return {
        ...state,
        [action.benchmarkId]: {
          ...existing,
          status: BenchmarkStatus.Done,
          current: action.run,
          previous: existing.current ?? existing.previous,
        },
      };
    }
    case ActionType.MarkSkipped:
      return {
        ...state,
        [action.benchmarkId]: { ...state[action.benchmarkId], status: BenchmarkStatus.Skipped },
      };
    case ActionType.ResetGroup: {
      const group = GROUPS.find((candidate) => candidate.id === action.groupId);
      if (!group) {
        return state;
      }
      const next = { ...state };
      for (const benchmark of group.benchmarks) {
        const benchmarkId = benchmarkIdOf(group, benchmark);
        next[benchmarkId] = {
          ...next[benchmarkId],
          status: benchmark.available ? BenchmarkStatus.Idle : BenchmarkStatus.Skipped,
        };
      }
      return next;
    }
    case ActionType.ClearAll:
      return initialState();
  }
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    return setTimeout(resolve, 0);
  });
}

export default function ModulesBenchmarksScreen() {
  const { theme } = useTheme();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const isRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const group of GROUPS) {
        for (const benchmark of group.benchmarks) {
          const benchmarkId = benchmarkIdOf(group, benchmark);
          try {
            const previous = await benchmarkHistoryStore.getPrevious(benchmarkId);
            if (cancelled) {
              return;
            }
            dispatch({ type: ActionType.SetPrevious, benchmarkId, previous });
          } catch (error) {
            console.warn(`Failed to load previous result for ${benchmarkId}:`, error);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runBenchmark = useCallback(async (group: Group, benchmark: Benchmark) => {
    const benchmarkId = benchmarkIdOf(group, benchmark);
    if (!benchmark.available) {
      dispatch({ type: ActionType.MarkSkipped, benchmarkId });
      return;
    }

    dispatch({ type: ActionType.MarkRunning, benchmarkId });
    await yieldToEventLoop();

    const iterations = iterationsOf(group);

    try {
      const timeMs = await benchmark.run(iterations);
      const run: BenchmarkRun = {
        timeMs,
        iterations,
        runAt: Date.now(),
      };
      dispatch({ type: ActionType.MarkDone, benchmarkId, run });
      try {
        await benchmarkHistoryStore.savePrevious(benchmarkId, run);
      } catch (error) {
        console.warn(`Failed to persist result for ${benchmarkId}:`, error);
      }
    } catch (error) {
      console.warn(`Benchmark ${benchmarkId} failed:`, error);
      dispatch({ type: ActionType.MarkSkipped, benchmarkId });
    }
  }, []);

  const runGroups = useCallback(
    async (groups: Group[]) => {
      if (isRunningRef.current) {
        return;
      }
      isRunningRef.current = true;
      try {
        for (const group of groups) {
          dispatch({ type: ActionType.ResetGroup, groupId: group.id });
        }
        for (const group of groups) {
          for (const benchmark of group.benchmarks) {
            await runBenchmark(group, benchmark);
          }
        }
      } finally {
        isRunningRef.current = false;
      }
    },
    [runBenchmark]
  );

  const runAll = useCallback(() => {
    return runGroups(GROUPS);
  }, [runGroups]);

  const runGroup = useCallback(
    (group: Group) => {
      return runGroups([group]);
    },
    [runGroups]
  );

  const clearResults = useCallback(async () => {
    if (isRunningRef.current) {
      return;
    }
    dispatch({ type: ActionType.ClearAll });
    try {
      await benchmarkHistoryStore.clearAll();
    } catch (error) {
      console.warn('Failed to clear benchmark history:', error);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background.screen }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Pressable onPress={runAll} style={styles.topBarButton}>
            <Text style={[styles.topBarButtonText, { color: theme.text.link }]}>
              Run all benchmarks
            </Text>
          </Pressable>
          <Pressable onPress={clearResults} style={styles.topBarButton}>
            <Text style={[styles.topBarButtonText, { color: theme.text.danger }]}>
              Clear results
            </Text>
          </Pressable>
        </View>

        {GROUPS.map((group) => {
          return (
            <BenchmarkTable
              key={group.id}
              group={group}
              state={state}
              onRun={() => {
                return runGroup(group);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topBarButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  topBarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
