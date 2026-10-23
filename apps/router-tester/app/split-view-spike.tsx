import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { presets, setSpikeConfig, useSpikeConfig } from '../utils/split-view-spike';

export default function SplitViewSpike() {
  const router = useRouter();
  const config = useSpikeConfig();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text>{JSON.stringify(config)}</Text>
      {Object.entries(presets).map(([name, preset]) => (
        <Pressable
          key={name}
          accessibilityRole="button"
          accessibilityLabel={`open-${name}`}
          style={styles.button}
          onPress={() => {
            setSpikeConfig({
              sidebarHeaderShown: undefined,
              detailHeaderShown: undefined,
              headerLargeTitle: undefined,
              ...preset,
              strategy: config.strategy,
            });
            router.replace('/split-view');
          }}>
          <Text style={styles.buttonText}>Open {name}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="toggle-strategy"
        style={styles.button}
        onPress={() =>
          setSpikeConfig({
            strategy:
              config.strategy === 'view'
                ? 'viewNoAsync'
                : config.strategy === 'viewNoAsync'
                  ? 'childViewController'
                  : 'view',
          })
        }>
        <Text style={styles.buttonText}>Strategy: {config.strategy}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 60, gap: 12 },
  button: { backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 },
  buttonText: { color: '#fff' },
});
