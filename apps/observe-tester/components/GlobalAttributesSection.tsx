import ExpoObserve, { type ObserveAttributes } from 'expo-observe';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

type GlobalAttributesPreset = {
  title: string;
  description: string;
  attributes: ObserveAttributes;
};

const PRESETS: GlobalAttributesPreset[] = [
  {
    title: 'Pro tier · variant B',
    description: 'subscription_tier, experiment_variant',
    attributes: {
      subscription_tier: 'pro',
      experiment_variant: 'B',
    },
  },
  {
    title: 'Trial tier · variant A',
    description: 'subscription_tier, experiment_variant, signup_flow',
    attributes: {
      subscription_tier: 'trial',
      experiment_variant: 'A',
      signup_flow: 'magic_link',
    },
  },
  {
    title: 'Collision case',
    description: 'sets `screen` globally — per-event `screen` should still win',
    attributes: {
      screen: 'global_default',
      build_channel: 'preview',
    },
  },
];

export function GlobalAttributesSection() {
  const theme = useTheme();

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Global attributes</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Attributes set here are merged into every subsequent metric's params and log record's
        attributes. Per-record keys take precedence on collision. Pick a preset, then fire a log
        event from the section below (or wait for the next metric flush) and inspect the dispatched
        record.
      </Text>
      {PRESETS.map(({ title, description, attributes }) => (
        <Button
          key={title}
          title={title}
          description={description}
          onPress={() => ExpoObserve.setGlobalAttributes(attributes)}
          theme="secondary"
        />
      ))}
      <Button
        title="Clear global attributes"
        description="Resets the store to empty"
        onPress={() => ExpoObserve.setGlobalAttributes(null)}
        theme="secondary"
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    marginBottom: 16,
  },
});
