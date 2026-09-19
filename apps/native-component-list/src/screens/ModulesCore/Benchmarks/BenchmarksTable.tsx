import { Code } from '@expo/html-elements';
import { useTheme } from 'ThemeProvider';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BenchmarkRun } from './ModulesBenchmarksHistory';
import {
  Benchmark,
  BenchmarkStatus,
  CellState,
  Group,
  PerOpUnit,
  State,
  benchmarkIdOf,
  formatIterations,
  formatPerOpIn,
  nsPerOp,
  perOpUnitFor,
  relativeUncertaintyOf,
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

type GroupScale = {
  fastestNs: number;
  slowestNs: number;
  unit: PerOpUnit;
};

const NEUTRAL_DELTA_THRESHOLD_PERCENT = 0.1;

// Above this, the confidence interval is too wide for small differences between rows to mean anything.
const NOISY_UNCERTAINTY = 0.02;

// Keeps a bar visible even when the benchmark is orders of magnitude faster than the slowest one.
const MIN_BAR_FRACTION = 0.015;

export function BenchmarkTable(props: { group: Group; state: State; onRun: () => void }) {
  const { theme } = useTheme();
  const { group, state, onRun } = props;

  const scale = useMemo(() => {
    return findGroupScale(group, state);
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
          styles.header,
          {
            backgroundColor: theme.background.subtle,
            borderBottomColor: theme.border.default,
          },
        ]}>
        <View style={styles.headerRow}>
          <Code style={[styles.headerTitle, { color: theme.text.default }]}>{group.title}</Code>
          <View style={styles.headerRightColumn}>
            <Text style={[styles.headerIterations, { color: theme.text.quaternary }]}>
              median{scale && ` · ${scale.unit.suffix}/op`}
            </Text>
            <Pressable
              onPress={onRun}
              style={({ pressed }) => [
                styles.runButton,
                pressed && { backgroundColor: theme.background.element },
              ]}>
              <Text style={[styles.runButtonText, { color: theme.text.link }]}>Run</Text>
            </Pressable>
          </View>
        </View>
        {group.description && (
          <Text style={[styles.headerDescription, { color: theme.text.secondary }]}>
            {group.description}
          </Text>
        )}
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
            scale={scale}
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
  scale: GroupScale | null;
  isLast: boolean;
}) {
  const { theme } = useTheme();
  const { group, benchmark, cell, scale, isLast } = props;

  const rowStyle = [
    styles.row,
    !isLast && {
      borderBottomColor: theme.border.default,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
  ];

  const current = cell.status === BenchmarkStatus.Done ? cell.current : null;

  return (
    <View style={rowStyle}>
      <View style={styles.rowHeader}>
        <Text style={[styles.benchmarkLabel, { color: theme.text.default }]}>
          {benchmark.label}
        </Text>
        <CurrentValue cell={cell} unit={scale?.unit ?? null} />
      </View>

      <View style={styles.meterRow}>
        <Meter run={current} scale={scale} />
        <Text
          style={[styles.ratioText, { color: theme.text.secondary }]}
          numberOfLines={1}
          ellipsizeMode="clip">
          {formatRatioLabel(current, scale)}
        </Text>
      </View>

      {current && scale && <StatsLine run={current} unit={scale.unit} />}

      {current && scale && (
        <View style={styles.uncertaintyRow}>
          <UncertaintyText run={current} unit={scale.unit} />
          {cell.previous != null && (
            <View style={styles.previousGroup}>
              <Text style={[styles.metaText, { color: theme.text.quaternary }]}>
                previous: {formatPerOpIn(medianNsOf(cell.previous), scale.unit)}
              </Text>
              <PreviousDeltaBadge current={current} previous={cell.previous} />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/** Horizontal bar scaled against the slowest benchmark of the group. */
function Meter({ run, scale }: { run: BenchmarkRun | null; scale: GroupScale | null }) {
  const { theme } = useTheme();
  const fraction =
    run != null && scale != null && scale.slowestNs > 0
      ? Math.max(MIN_BAR_FRACTION, Math.min(1, medianNsOf(run) / scale.slowestNs))
      : null;
  return (
    <View style={[styles.meterTrack, { backgroundColor: theme.background.element }]}>
      {fraction != null && (
        <View
          style={[
            styles.meterFill,
            { width: `${fraction * 100}%`, backgroundColor: theme.text.link },
          ]}
        />
      )}
    </View>
  );
}

/** The series behind the headline median: mean, fastest and slowest, and how many were run. */
function StatsLine({ run, unit }: { run: BenchmarkRun; unit: PerOpUnit }) {
  const { theme } = useTheme();
  const perOp = (ms: number) => {
    return formatPerOpIn(nsPerOp(ms, run.iterations), unit);
  };
  return (
    <Text style={[styles.metaText, styles.statsLine, { color: theme.text.quaternary }]}>
      avg {perOp(run.meanMs)} · min {perOp(run.minMs)} · max {perOp(run.maxMs)} ·{' '}
      {formatIterations(run.iterations)} × {run.samples.length}
    </Text>
  );
}

/** How well the series pin down the median: the 95% confidence range and its half-width. */
function UncertaintyText({ run, unit }: { run: BenchmarkRun; unit: PerOpUnit }) {
  const { theme } = useTheme();
  const uncertainty = relativeUncertaintyOf(run);
  const color = uncertainty > NOISY_UNCERTAINTY ? theme.text.warning : theme.text.quaternary;
  return (
    <Text style={[styles.metaText, { color }]}>
      median {formatPerOpIn(nsPerOp(run.ciLowMs, run.iterations), unit)}–
      {formatPerOpIn(nsPerOp(run.ciHighMs, run.iterations), unit)} ±{(uncertainty * 100).toFixed(1)}
      % (95% confidence)
    </Text>
  );
}

function PreviousDeltaBadge({
  current,
  previous,
}: {
  current: BenchmarkRun;
  previous: BenchmarkRun;
}) {
  const { theme } = useTheme();
  const delta = computeDelta(medianNsOf(current), medianNsOf(previous));
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

function CurrentValue({ cell, unit }: { cell: CellState; unit: PerOpUnit | null }) {
  const { theme } = useTheme();
  switch (cell.status) {
    case BenchmarkStatus.Skipped:
      return (
        <Text style={[styles.currentText, { color: theme.text.quaternary }]}>not available</Text>
      );
    case BenchmarkStatus.Running:
      return (
        <Text style={[styles.currentText, { color: theme.text.quaternary }]}>
          {cell.iterations == null ? 'calibrating…' : `running… ${cell.completedSeries} series`}
        </Text>
      );
    case BenchmarkStatus.Done:
      return (
        <Text style={[styles.currentText, styles.currentDone, { color: theme.text.default }]}>
          {cell.current == null || unit == null
            ? '—'
            : `${formatPerOpIn(medianNsOf(cell.current), unit)} ${unit.suffix}`}
        </Text>
      );
    case BenchmarkStatus.Idle:
      return <Text style={[styles.currentText, { color: theme.text.quaternary }]}>—</Text>;
  }
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

function formatRatioLabel(run: BenchmarkRun | null, scale: GroupScale | null): string {
  if (run == null || scale == null || scale.fastestNs <= 0) {
    return '';
  }
  const medianNs = medianNsOf(run);
  if (medianNs <= scale.fastestNs) {
    return 'fastest';
  }
  return `${formatRatio(medianNs / scale.fastestNs)} slower`;
}

/** Median cost of a single call, the unit every comparison on this screen uses. */
function medianNsOf(run: BenchmarkRun): number {
  return nsPerOp(run.medianMs, run.iterations);
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

function findGroupScale(group: Group, state: State): GroupScale | null {
  let fastestNs: number | null = null;
  let slowestNs: number | null = null;
  for (const benchmark of group.benchmarks) {
    const cell = state[benchmarkIdOf(group, benchmark)];
    if (cell.status !== BenchmarkStatus.Done || cell.current == null) {
      continue;
    }
    const medianNs = medianNsOf(cell.current);
    if (fastestNs == null || medianNs < fastestNs) {
      fastestNs = medianNs;
    }
    if (slowestNs == null || medianNs > slowestNs) {
      slowestNs = medianNs;
    }
  }
  if (fastestNs == null || slowestNs == null) {
    return null;
  }
  return { fastestNs, slowestNs, unit: perOpUnitFor(fastestNs) };
}

const styles = StyleSheet.create({
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerRightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  headerIterations: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  headerDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  runButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: -10,
    marginRight: -12,
    marginBottom: -10,
  },
  runButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  benchmarkLabel: {
    flex: 1,
    fontSize: 15,
  },
  currentText: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  currentDone: {
    fontWeight: '600',
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  meterTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratioText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    minWidth: 76,
    textAlign: 'right',
  },
  statsLine: {
    marginTop: 6,
  },
  uncertaintyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  previousGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
