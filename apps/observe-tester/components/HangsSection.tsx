import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { HANG_TRIGGERS } from '@/components/hangTriggers';
import { useTheme } from '@/utils/theme';

export function HangsSection() {
  const theme = useTheme();

  if (HANG_TRIGGERS.length === 0) {
    return null;
  }

  return (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text.default }]}>Hangs and memory</Text>
      <Text style={[styles.sectionHint, { color: theme.text.secondary }]}>
        Block a thread or use up memory. The events show in the session logs.
      </Text>
      {HANG_TRIGGERS.map(({ title, description, run }) => (
        <Button
          key={title}
          title={title}
          description={description}
          onPress={run}
          theme="secondary"
        />
      ))}
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
