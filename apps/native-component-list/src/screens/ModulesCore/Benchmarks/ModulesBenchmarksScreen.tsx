import { useTheme } from 'ThemeProvider';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BenchmarkTable } from './BenchmarksTable';
import { BenchmarkRun, benchmarkHistoryStore } from './ModulesBenchmarksHistory';
import { buildMarkdownReport } from './benchmarkReport';
import {
  Benchmark,
  BenchmarkStatus,
  GROUPS,
  Group,
  MAX_SERIES,
  State,
  benchmarkIdOf,
  calibrate,
  cooldown,
  formatPerOp,
  hasEnoughSamples,
  nsPerOp,
  relativeUncertaintyOf,
  summarize,
  timeSeries,
  warmUpAndRefine,
} from './benchmarks';

/** A benchmark that has been calibrated and warmed up, ready for its timed series. */
type BenchmarkPlan = {
  benchmark: Benchmark;
  benchmarkId: string;
  iterations: number;
};

/** A single completed benchmark result, collected per group to print a summary to the console. */
type BenchmarkLogEntry = {
  label: string;
  run: BenchmarkRun;
};

enum ActionType {
  SetPrevious = 'setPrevious',
  MarkRunning = 'markRunning',
  MarkCalibrated = 'markCalibrated',
  MarkSeriesDone = 'markSeriesDone',
  MarkDone = 'markDone',
  MarkSkipped = 'markSkipped',
  ResetGroup = 'resetGroup',
  ClearAll = 'clearAll',
}

type Action =
  | { type: ActionType.SetPrevious; benchmarkId: string; previous: BenchmarkRun | null }
  | { type: ActionType.MarkRunning; benchmarkId: string }
  | { type: ActionType.MarkCalibrated; benchmarkId: string; iterations: number }
  | { type: ActionType.MarkSeriesDone; benchmarkId: string; completedSeries: number }
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
        iterations: null,
        completedSeries: 0,
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
          iterations: null,
          completedSeries: 0,
        },
      };
    case ActionType.MarkCalibrated:
      return {
        ...state,
        [action.benchmarkId]: { ...state[action.benchmarkId], iterations: action.iterations },
      };
    case ActionType.MarkSeriesDone:
      return {
        ...state,
        [action.benchmarkId]: {
          ...state[action.benchmarkId],
          completedSeries: action.completedSeries,
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
          iterations: null,
          completedSeries: 0,
        };
      }
      return next;
    }
    case ActionType.ClearAll:
      return initialState();
  }
}

export default function ModulesBenchmarksScreen() {
  const { theme } = useTheme();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const isRunningRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

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

  /**
   * Calibrates and warms up every available benchmark of the group, then runs the timed
   * series round-robin across them. Interleaving means thermal drift over the group is
   * shared by all of its benchmarks instead of landing on whichever one runs last.
   */
  const runGroup = useCallback(async (group: Group) => {
    for (const benchmark of group.benchmarks) {
      const benchmarkId = benchmarkIdOf(group, benchmark);
      dispatch(
        benchmark.available
          ? { type: ActionType.MarkRunning, benchmarkId }
          : { type: ActionType.MarkSkipped, benchmarkId }
      );
    }

    const plans: BenchmarkPlan[] = [];
    for (const benchmark of group.benchmarks) {
      if (!benchmark.available) {
        continue;
      }
      const benchmarkId = benchmarkIdOf(group, benchmark);
      try {
        await cooldown();
        const probed = await calibrate(benchmark);
        const iterations = await warmUpAndRefine(benchmark, probed);
        dispatch({ type: ActionType.MarkCalibrated, benchmarkId, iterations });
        plans.push({ benchmark, benchmarkId, iterations });
      } catch (error) {
        console.warn(`Benchmark ${benchmarkId} failed to calibrate:`, error);
        dispatch({ type: ActionType.MarkSkipped, benchmarkId });
      }
    }

    const samples = new Map<string, number[]>();
    const pending = [...plans];
    for (let round = 0; round < MAX_SERIES && pending.length > 0; round++) {
      for (const plan of [...pending]) {
        const drop = () => {
          pending.splice(pending.indexOf(plan), 1);
        };
        try {
          await cooldown();
          const elapsed = await timeSeries(plan.benchmark, plan.iterations);
          const collected = samples.get(plan.benchmarkId) ?? [];
          collected.push(elapsed);
          samples.set(plan.benchmarkId, collected);
          dispatch({
            type: ActionType.MarkSeriesDone,
            benchmarkId: plan.benchmarkId,
            completedSeries: collected.length,
          });
          if (hasEnoughSamples(collected)) {
            drop();
          }
        } catch (error) {
          console.warn(`Benchmark ${plan.benchmarkId} failed:`, error);
          drop();
          dispatch({ type: ActionType.MarkSkipped, benchmarkId: plan.benchmarkId });
        }
      }
    }

    const entries: BenchmarkLogEntry[] = [];
    for (const plan of plans) {
      const collected = samples.get(plan.benchmarkId);
      if (!collected || collected.length === 0) {
        continue;
      }
      const run = summarize(collected, plan.iterations);
      dispatch({ type: ActionType.MarkDone, benchmarkId: plan.benchmarkId, run });
      try {
        await benchmarkHistoryStore.savePrevious(plan.benchmarkId, run);
      } catch (error) {
        console.warn(`Failed to persist result for ${plan.benchmarkId}:`, error);
      }
      entries.push({ label: plan.benchmark.label, run });
    }
    return entries;
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
          const entries = await runGroup(group);
          if (entries.length === 0) {
            continue;
          }
          const lines = entries.map(({ label, run }) => {
            const median = formatPerOp(nsPerOp(run.medianMs, run.iterations));
            const uncertaintyPercent = relativeUncertaintyOf(run) * 100;
            return (
              `- ${label}: ${median}/op ±${uncertaintyPercent.toFixed(1)}% ` +
              `(avg ${formatPerOp(nsPerOp(run.meanMs, run.iterations))}, ` +
              `min ${formatPerOp(nsPerOp(run.minMs, run.iterations))}, ` +
              `max ${formatPerOp(nsPerOp(run.maxMs, run.iterations))}, ` +
              `${run.iterations} iters × ${run.samples.length})`
            );
          });
          console.log(`[benchmark] ${group.title}:\n${lines.join('\n')}\n`);
        }
      } finally {
        isRunningRef.current = false;
      }
    },
    [runGroup]
  );

  const runAll = useCallback(() => {
    return runGroups(GROUPS);
  }, [runGroups]);

  const runSingleGroup = useCallback(
    (group: Group) => {
      return runGroups([group]);
    },
    [runGroups]
  );

  const copyResults = useCallback(async () => {
    const report = buildMarkdownReport(stateRef.current);
    if (report == null) {
      Alert.alert('Nothing to copy', 'Run at least one benchmark first.');
      return;
    }
    try {
      await Clipboard.setStringAsync(report);
      Alert.alert('Copied', 'Results copied as markdown.');
    } catch (error) {
      console.warn('Failed to copy benchmark results:', error);
      Alert.alert('Failed to copy', String(error));
    }
  }, []);

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
            <Text style={[styles.topBarButtonText, { color: theme.text.link }]}>Run all</Text>
          </Pressable>
          <Pressable onPress={copyResults} style={styles.topBarButton}>
            <Text style={[styles.topBarButtonText, { color: theme.text.link }]}>Copy results</Text>
          </Pressable>
          <Pressable onPress={clearResults} style={styles.topBarButton}>
            <Text style={[styles.topBarButtonText, { color: theme.text.danger }]}>Clear</Text>
          </Pressable>
        </View>

        {GROUPS.map((group) => {
          return (
            <BenchmarkTable
              key={group.id}
              group={group}
              state={state}
              onRun={() => {
                return runSingleGroup(group);
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
