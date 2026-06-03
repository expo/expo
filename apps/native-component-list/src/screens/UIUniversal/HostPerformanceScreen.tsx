import { Button, Column, Host } from '@expo/ui';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BUTTON_COUNT = 100;
const COMPARISON_SAMPLE_COUNT = 10;
const MAX_VISIBLE_SAMPLES = 8;
const MAX_RETAINED_SAMPLES = 40;

type BenchmarkMode = 'individual' | 'shared';

type MetricName = 'commitMs' | 'settledMs';

type BenchmarkSample = {
  id: number;
  mode: BenchmarkMode;
  commitMs: number;
  settledMs: number;
};

type ActiveSample = {
  id: number;
  mode: BenchmarkMode;
};

type PendingSample = {
  id: number;
  mode: BenchmarkMode;
  startedAt: number;
  metrics: Partial<Record<MetricName, number>>;
  resolve: (sample: BenchmarkSample) => void;
};

type ModeStats = {
  count: number;
  commitMs?: number;
  settledMs?: number;
};

type HostPerformanceScreenProps = {
  route?: {
    params?: {
      autorun?: boolean | string;
    };
  };
};

const noop = () => {};

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function average(values: (number | undefined)[]) {
  const numericValues = values.filter((value): value is number => value != null);
  if (numericValues.length === 0) {
    return undefined;
  }
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}

function getModeStats(samples: BenchmarkSample[], mode: BenchmarkMode): ModeStats {
  const modeSamples = samples.filter((sample) => sample.mode === mode);

  return {
    count: modeSamples.length,
    commitMs: average(modeSamples.map((sample) => sample.commitMs)),
    settledMs: average(modeSamples.map((sample) => sample.settledMs)),
  };
}

function formatMs(value?: number) {
  return value == null ? '--' : `${value.toFixed(1)} ms`;
}

function modeLabel(mode: BenchmarkMode) {
  return mode === 'individual' ? 'Individual auto hosts' : 'Single shared Host';
}

function expectedHostCount(mode: BenchmarkMode) {
  return mode === 'individual' ? BUTTON_COUNT : 1;
}

function reportBenchmarkError(error: unknown) {
  console.error('[UIUniversal HostPerformance] benchmark failed', error);
}

function BenchmarkButtons() {
  return (
    <>
      {Array.from({ length: BUTTON_COUNT }, (_, index) => (
        <Button
          key={index}
          label={`Button ${index + 1}`}
          variant={index % 3 === 0 ? 'filled' : index % 3 === 1 ? 'outlined' : 'text'}
          onPress={noop}
        />
      ))}
    </>
  );
}

function IndividualHostButtons() {
  return (
    <View style={styles.individualStack}>
      <BenchmarkButtons />
    </View>
  );
}

function SharedHostButtons() {
  return (
    <Host matchContents>
      <Column spacing={8} alignment="start">
        <BenchmarkButtons />
      </Column>
    </Host>
  );
}

function BenchmarkProbe({
  children,
  sample,
  onMetric,
}: {
  children: ReactNode;
  sample: ActiveSample;
  onMetric: (id: number, metric: MetricName, endedAt: number) => void;
}) {
  useLayoutEffect(() => {
    if (sample.id === 0) {
      return;
    }

    onMetric(sample.id, 'commitMs', now());

    let interactionFrame = 0;

    const interaction = InteractionManager.runAfterInteractions(() => {
      interactionFrame = requestAnimationFrame(() => {
        onMetric(sample.id, 'settledMs', now());
      });
    });

    return () => {
      cancelAnimationFrame(interactionFrame);
      interaction.cancel();
    };
  }, [onMetric, sample.id]);

  return (
    <View key={`${sample.mode}-${sample.id}`} style={styles.benchmarkArea}>
      {children}
    </View>
  );
}

function ModeButton({
  disabled,
  mode,
  selected,
  onPress,
}: {
  disabled: boolean;
  mode: BenchmarkMode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.modeButton,
        selected && styles.modeButtonSelected,
        disabled && styles.disabled,
      ]}
      onPress={onPress}>
      <Text style={[styles.modeButtonText, selected && styles.modeButtonTextSelected]}>
        {mode === 'individual' ? 'Individual' : 'Shared'}
      </Text>
    </Pressable>
  );
}

function ActionButton({
  children,
  disabled,
  primary,
  onPress,
}: {
  children: string;
  disabled?: boolean;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.actionButton,
        primary ? styles.primaryActionButton : styles.secondaryActionButton,
        disabled && styles.disabled,
      ]}
      onPress={onPress}>
      <Text style={[styles.actionButtonText, primary && styles.primaryActionButtonText]}>
        {children}
      </Text>
    </Pressable>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function StatsPanel({
  mode,
  selected,
  stats,
}: {
  mode: BenchmarkMode;
  selected: boolean;
  stats: ModeStats;
}) {
  return (
    <View style={[styles.statsPanel, selected && styles.statsPanelSelected]}>
      <Text style={styles.statsTitle}>{modeLabel(mode)}</Text>
      <MetricRow label="Host views" value={String(expectedHostCount(mode))} />
      <MetricRow label="Samples" value={String(stats.count)} />
      <MetricRow label="Commit avg" value={formatMs(stats.commitMs)} />
      <MetricRow label="Settled avg" value={formatMs(stats.settledMs)} />
    </View>
  );
}

function SampleRow({ sample }: { sample: BenchmarkSample }) {
  return (
    <View style={styles.sampleRow}>
      <Text style={styles.sampleMode}>{modeLabel(sample.mode)}</Text>
      <Text style={styles.sampleMetric}>{formatMs(sample.settledMs)}</Text>
    </View>
  );
}

export default function HostPerformanceScreen({ route }: HostPerformanceScreenProps) {
  const [mode, setMode] = useState<BenchmarkMode>('individual');
  const [activeSample, setActiveSample] = useState<ActiveSample>({ id: 0, mode: 'individual' });
  const [samples, setSamples] = useState<BenchmarkSample[]>([]);
  const [running, setRunning] = useState(false);
  const nextSampleId = useRef(0);
  const pendingSample = useRef<PendingSample | null>(null);
  const didAutorun = useRef(false);

  const finishPendingSample = useCallback((id: number) => {
    const pending = pendingSample.current;
    if (!pending || pending.id !== id) {
      return;
    }

    const sample: BenchmarkSample = {
      id: pending.id,
      mode: pending.mode,
      commitMs: pending.metrics.commitMs ?? 0,
      settledMs: pending.metrics.settledMs ?? 0,
    };

    console.log(
      `[UIUniversal HostPerformance] ${sample.mode}: commit=${formatMs(
        sample.commitMs
      )}, settled=${formatMs(sample.settledMs)}`
    );

    pendingSample.current = null;
    setSamples((currentSamples) => [sample, ...currentSamples].slice(0, MAX_RETAINED_SAMPLES));
    pending.resolve(sample);
  }, []);

  const recordMetric = useCallback(
    (id: number, metric: MetricName, endedAt: number) => {
      const pending = pendingSample.current;
      if (!pending || pending.id !== id || pending.metrics[metric] != null) {
        return;
      }

      pending.metrics[metric] = endedAt - pending.startedAt;

      if (metric === 'settledMs') {
        finishPendingSample(id);
      }
    },
    [finishPendingSample]
  );

  const startSample = useCallback((nextMode: BenchmarkMode) => {
    return new Promise<BenchmarkSample>((resolve) => {
      const id = nextSampleId.current + 1;
      nextSampleId.current = id;

      pendingSample.current = {
        id,
        mode: nextMode,
        startedAt: now(),
        metrics: {},
        resolve,
      };

      setMode(nextMode);
      setActiveSample({ id, mode: nextMode });
    });
  }, []);

  const runCurrentModeSample = useCallback(() => {
    if (!running) {
      startSample(mode).catch(reportBenchmarkError);
    }
  }, [mode, running, startSample]);

  const runComparison = useCallback(async () => {
    setRunning(true);
    setSamples([]);

    try {
      const sequence: BenchmarkMode[] = [];
      for (let i = 0; i < COMPARISON_SAMPLE_COUNT; i++) {
        sequence.push('individual', 'shared');
      }

      for (const nextMode of sequence) {
        await startSample(nextMode);
        await wait(80);
      }
    } finally {
      setRunning(false);
    }
  }, [startSample]);

  useEffect(() => {
    const autorun = route?.params?.autorun;
    const shouldAutorun = autorun === true || autorun === 'true' || autorun === '1';

    if (shouldAutorun && !didAutorun.current && !running) {
      didAutorun.current = true;
      runComparison().catch(reportBenchmarkError);
    }
  }, [route?.params?.autorun, runComparison, running]);

  const individualStats = useMemo(() => getModeStats(samples, 'individual'), [samples]);
  const sharedStats = useMemo(() => getModeStats(samples, 'shared'), [samples]);
  const visibleSamples = samples.slice(0, MAX_VISIBLE_SAMPLES);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Host performance</Text>
        <Text style={styles.subtitle}>
          {BUTTON_COUNT} adjacent universal buttons, measured while remounting the benchmark area.
        </Text>
      </View>

      <View style={styles.modeSelector}>
        <ModeButton
          disabled={running}
          mode="individual"
          selected={mode === 'individual'}
          onPress={() => {
            startSample('individual').catch(reportBenchmarkError);
          }}
        />
        <ModeButton
          disabled={running}
          mode="shared"
          selected={mode === 'shared'}
          onPress={() => {
            startSample('shared').catch(reportBenchmarkError);
          }}
        />
      </View>

      <View style={styles.actions}>
        <ActionButton
          primary
          disabled={running}
          onPress={() => {
            runComparison().catch(reportBenchmarkError);
          }}>
          {running ? 'Running...' : `Run ${COMPARISON_SAMPLE_COUNT}x comparison`}
        </ActionButton>
        <ActionButton disabled={running} onPress={runCurrentModeSample}>
          Sample current mode
        </ActionButton>
      </View>

      <View style={styles.statsGrid}>
        <StatsPanel mode="individual" selected={mode === 'individual'} stats={individualStats} />
        <StatsPanel mode="shared" selected={mode === 'shared'} stats={sharedStats} />
      </View>

      {visibleSamples.length > 0 && (
        <View style={styles.samplesPanel}>
          <Text style={styles.samplesTitle}>Latest settled samples</Text>
          {visibleSamples.map((sample) => (
            <SampleRow key={sample.id} sample={sample} />
          ))}
        </View>
      )}

      <BenchmarkProbe sample={activeSample} onMetric={recordMetric}>
        {mode === 'individual' ? <IndividualHostButtons /> : <SharedHostButtons />}
      </BenchmarkProbe>
    </ScrollView>
  );
}

HostPerformanceScreen.navigationOptions = {
  title: 'Host performance',
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionButtonText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  benchmarkArea: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  container: {
    gap: 16,
    padding: 16,
  },
  disabled: {
    opacity: 0.55,
  },
  header: {
    gap: 6,
  },
  individualStack: {
    alignItems: 'flex-start',
    gap: 8,
  },
  metricLabel: {
    color: '#4b5563',
    flex: 1,
    fontSize: 13,
  },
  metricRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  metricValue: {
    color: '#111827',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  modeButtonSelected: {
    backgroundColor: '#111827',
  },
  modeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modeButtonTextSelected: {
    color: '#ffffff',
  },
  modeSelector: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 4,
  },
  primaryActionButton: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  primaryActionButtonText: {
    color: '#ffffff',
  },
  sampleMetric: {
    color: '#111827',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  sampleMode: {
    color: '#374151',
    flex: 1,
    fontSize: 13,
  },
  sampleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  samplesPanel: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
  },
  samplesTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionButton: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  statsGrid: {
    gap: 12,
  },
  statsPanel: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
  },
  statsPanelSelected: {
    borderColor: '#111827',
  },
  statsTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
});
