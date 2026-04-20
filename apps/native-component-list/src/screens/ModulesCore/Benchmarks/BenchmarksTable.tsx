import { Code } from '@expo/html-elements';
import { useTheme } from 'ThemeProvider';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Benchmark,
  BenchmarkStatus,
  CellState,
  Group,
  State,
  benchmarkIdOf,
  iterationsOf,
} from './benchmarks';

enum DeltaTone {
  Faster = 'faster',
  Slower = 'slower',
  Neutral = 'neutral',
}

type Delta = {
  text: string;
  tone: DeltaTone;
};

const NEUTRAL_DELTA_THRESHOLD_PERCENT = 0.1;

export function BenchmarkTable(props: { group: Group; state: State; onRun: () => void }) {
  const { theme } = useTheme();
  const { group, state, onRun } = props;

  const fastestMs = useMemo(() => {
    return findGroupFastestMs(group, state);
  }, [group, state]);

  return (
    <View
      style={[
        styles.table,
        {
          backgroundColor: theme.background.default,
          borderColor: theme.border.default,
        },
      ]}>
      <View
        style={[
          styles.headerRow,
          {
            backgroundColor: theme.background.subtle,
            borderBottomColor: theme.border.default,
          },
        ]}>
        <View style={styles.headerTitleColumn}>
          <Code style={[styles.headerTitle, { color: theme.text.default }]}>{group.title}</Code>
          <Text style={[styles.headerIterations, { color: theme.text.quaternary }]}>
            {iterationsOf(group).toLocaleString()}× per benchmark
          </Text>
        </View>
        <Pressable onPress={onRun} style={styles.runButton}>
          <Text style={[styles.runButtonText, { color: theme.text.link }]}>Run</Text>
        </Pressable>
      </View>
      {group.benchmarks.map((benchmark, index) => {
        const cell = state[benchmarkIdOf(group, benchmark)];
        const isLast = index === group.benchmarks.length - 1;
        return (
          <BenchmarkRow
            key={benchmark.id}
            group={group}
            benchmark={benchmark}
            cell={cell}
            fastestMs={fastestMs}
            isLast={isLast}
          />
        );
      })}
    </View>
  );
}

function BenchmarkRow(props: {
  group: Group;
  benchmark: Benchmark;
  cell: CellState;
  fastestMs: number | null;
  isLast: boolean;
}) {
  const { theme } = useTheme();
  const { group, benchmark, cell, fastestMs, isLast } = props;

  const rowStyle = [
    styles.row,
    !isLast && {
      borderBottomColor: theme.border.default,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
  ];

  const previousMatchesCurrentIterations =
    cell.previous != null && cell.previous.iterations === iterationsOf(group);

  return (
    <View style={rowStyle}>
      <View style={styles.rowLeft}>
        <Text style={[styles.benchmarkLabel, { color: theme.text.default }]}>
          {benchmark.label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={styles.currentRow}>
          <GroupDeltaBadge cell={cell} fastestMs={fastestMs} />
          <CurrentValue cell={cell} />
        </View>
        {previousMatchesCurrentIterations && (
          <View style={styles.previousRow}>
            <Text style={[styles.previousText, { color: theme.text.quaternary }]}>
              previous: {formatTime(cell.previous!.timeMs)}
            </Text>
            <PreviousDeltaBadge cell={cell} />
          </View>
        )}
      </View>
    </View>
  );
}

function PreviousDeltaBadge({ cell }: { cell: CellState }) {
  const { theme } = useTheme();
  if (cell.status !== BenchmarkStatus.Done || cell.current == null || cell.previous == null) {
    return null;
  }
  const delta = computeDelta(cell.current.timeMs, cell.previous.timeMs);
  if (!delta) {
    return null;
  }
  const color =
    delta.tone === DeltaTone.Faster
      ? theme.text.success
      : delta.tone === DeltaTone.Slower
        ? theme.text.danger
        : theme.text.quaternary;
  return <Text style={[styles.deltaText, { color }]}>({delta.text})</Text>;
}

function GroupDeltaBadge({ cell, fastestMs }: { cell: CellState; fastestMs: number | null }) {
  const { theme } = useTheme();
  if (
    cell.status !== BenchmarkStatus.Done ||
    cell.current == null ||
    fastestMs == null ||
    fastestMs <= 0
  ) {
    return null;
  }
  if (cell.current.timeMs <= fastestMs) {
    return <Text style={[styles.groupDeltaText, { color: theme.text.success }]}>fastest</Text>;
  }
  const ratio = cell.current.timeMs / fastestMs;
  return (
    <Text style={[styles.groupDeltaText, { color: theme.text.danger }]}>
      {formatRatio(ratio)} slower
    </Text>
  );
}

function CurrentValue({ cell }: { cell: CellState }) {
  const { theme } = useTheme();
  switch (cell.status) {
    case BenchmarkStatus.Skipped:
      return (
        <Text style={[styles.currentText, { color: theme.text.quaternary }]}>not available</Text>
      );
    case BenchmarkStatus.Running:
      return <Text style={[styles.currentText, { color: theme.text.quaternary }]}>running…</Text>;
    case BenchmarkStatus.Done:
      return (
        <Text style={[styles.currentText, styles.currentDone, { color: theme.text.default }]}>
          {formatTime(cell.current?.timeMs ?? 0)}
        </Text>
      );
    case BenchmarkStatus.Idle:
      return <Text style={[styles.currentText, { color: theme.text.quaternary }]}>—</Text>;
  }
}

function formatTime(ms: number): string {
  return `${ms.toFixed(2)} ms`;
}

function formatRatio(ratio: number): string {
  if (ratio >= 100) {
    return `${Math.round(ratio)}×`;
  }
  if (ratio >= 10) {
    return `${ratio.toFixed(1)}×`;
  }
  return `${ratio.toFixed(2)}×`;
}

function computeDelta(currentMs: number, previousMs: number): Delta | null {
  if (previousMs <= 0) {
    return null;
  }
  const percent = ((currentMs - previousMs) / previousMs) * 100;
  const magnitude = Math.abs(percent);
  if (magnitude < NEUTRAL_DELTA_THRESHOLD_PERCENT) {
    return { text: `±${magnitude.toFixed(1)}%`, tone: DeltaTone.Neutral };
  }
  const sign = percent < 0 ? '−' : '+';
  const tone = percent < 0 ? DeltaTone.Faster : DeltaTone.Slower;
  return { text: `${sign}${magnitude.toFixed(1)}%`, tone };
}

function findGroupFastestMs(group: Group, state: State): number | null {
  let fastest: number | null = null;
  for (const benchmark of group.benchmarks) {
    const cell = state[benchmarkIdOf(group, benchmark)];
    if (cell.status !== BenchmarkStatus.Done || cell.current == null) {
      continue;
    }
    if (fastest == null || cell.current.timeMs < fastest) {
      fastest = cell.current.timeMs;
    }
  }
  return fastest;
}

const styles = StyleSheet.create({
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleColumn: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerIterations: {
    fontSize: 12,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  runButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  benchmarkLabel: {
    fontSize: 15,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentText: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    minWidth: 90,
    textAlign: 'right',
  },
  currentDone: {
    fontWeight: '600',
  },
  groupDeltaText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  previousRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  previousText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
