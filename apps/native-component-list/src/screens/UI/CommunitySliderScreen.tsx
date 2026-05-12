import { Slider } from '@expo/ui/community/slider';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Page } from '../../components/Page';

const RANGES = [
  { label: '0 – 1', min: 0, max: 1 },
  { label: '0 – 100', min: 0, max: 100 },
  { label: '-1 – 1', min: -1, max: 1 },
] as const;

const WIDTHS = [
  { label: 'Auto', value: undefined },
  { label: '240', value: 240 },
] as const;

// Step is range-relative so it stays meaningful when range changes.
const STEPS = [
  { label: 'Continuous', factor: 0 },
  { label: '1/10', factor: 0.1 },
  { label: '1/4', factor: 0.25 },
] as const;

const TINTS = [
  { label: 'Default', min: undefined, max: undefined, thumb: undefined },
  { label: 'Red', min: '#ef4444', max: '#fecaca', thumb: '#dc2626' },
  { label: 'Blue', min: '#3b82f6', max: '#bfdbfe', thumb: '#1d4ed8' },
] as const;

export default function CommunitySliderScreen() {
  const [rangeIndex, setRangeIndex] = useState(0);
  const [widthIndex, setWidthIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [tintIndex, setTintIndex] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [limited, setLimited] = useState(false);
  const [value, setValue] = useState(0.5);

  const range = RANGES[rangeIndex];
  const width = WIDTHS[widthIndex].value;
  const step = STEPS[stepIndex].factor * (range.max - range.min);
  const tint = TINTS[tintIndex];
  // Limits clamp to the inner 60% of the range when enabled.
  const span = range.max - range.min;
  const lowerLimit = limited ? range.min + span * 0.2 : undefined;
  const upperLimit = limited ? range.min + span * 0.8 : undefined;

  const onSelectRange = (i: number) => {
    setRangeIndex(i);
    const next = RANGES[i];
    setValue((next.min + next.max) / 2);
  };

  return (
    <Page>
      <View style={styles.preview}>
        <Slider
          value={value}
          minimumValue={range.min}
          maximumValue={range.max}
          step={step}
          disabled={disabled}
          inverted={inverted}
          lowerLimit={lowerLimit}
          upperLimit={upperLimit}
          minimumTrackTintColor={tint.min}
          maximumTrackTintColor={tint.max}
          thumbTintColor={tint.thumb}
          onValueChange={setValue}
          style={width ? { width, alignSelf: 'center' } : { alignSelf: 'stretch' }}
        />
        <Text style={styles.valueLabel}>{value.toFixed(3)}</Text>
      </View>

      <View style={styles.controls}>
        <PillRow
          label="Range"
          options={RANGES.map((r) => r.label)}
          index={rangeIndex}
          onSelect={onSelectRange}
        />
        <PillRow
          label="Step"
          options={STEPS.map((s) => s.label)}
          index={stepIndex}
          onSelect={setStepIndex}
        />
        <PillRow
          label="Tint"
          options={TINTS.map((t) => t.label)}
          index={tintIndex}
          onSelect={setTintIndex}
        />
        <PillRow
          label="Width"
          options={WIDTHS.map((w) => w.label)}
          index={widthIndex}
          onSelect={setWidthIndex}
        />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Disabled</Text>
          <Switch value={disabled} onValueChange={setDisabled} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Inverted</Text>
          <Switch value={inverted} onValueChange={setInverted} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Limits (inner 60%)</Text>
          <Switch value={limited} onValueChange={setLimited} />
        </View>
      </View>
    </Page>
  );
}

CommunitySliderScreen.navigationOptions = {
  title: 'Community Slider',
};

function PillRow({
  label,
  options,
  index,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.pillGroup}>
        {options.map((opt, i) => {
          const selected = i === index;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(i)}
              style={[styles.pill, selected && styles.pillSelected]}>
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    gap: 12,
  },
  valueLabel: {
    fontFamily: 'Menlo',
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
  },
  controls: {
    marginTop: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  pillGroup: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    padding: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  pillText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#111827',
  },
});
