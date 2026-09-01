import { Link, NavigationAwareActivity, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ActivityHome() {
  return (
    <NavigationAwareActivity>
      <ActivityHomeContents />
    </NavigationAwareActivity>
  );
}

function ActivityHomeContents() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [effectRuns, setEffectRuns] = useState(0);
  const [cleanupRuns, setCleanupRuns] = useState(0);

  useEffect(() => {
    setEffectRuns((runs) => runs + 1);
    return () => setCleanupRuns((runs) => runs + 1);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title} testID="e2e-screen">
        Navigation Aware Activity
      </Text>
      <Text testID="e2e-pathname">{pathname}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>State</Text>
        <Text testID="e2e-counter">Counter: {count}</Text>
        <Pressable
          testID="e2e-increment"
          style={styles.button}
          onPress={() => setCount((value) => value + 1)}>
          <Text style={styles.buttonText}>Increment</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Effects</Text>
        <Text testID="e2e-effect-runs">Effect runs: {effectRuns}</Text>
        <Text testID="e2e-cleanup-runs">Cleanup runs: {cleanupRuns}</Text>
      </View>

      <Link testID="e2e-goto-a" href="/navigation-aware-activity/a" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Go to Screen A</Text>
        </Pressable>
      </Link>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instruction}>1. Increment the counter a few times.</Text>
        <Text style={styles.instruction}>
          2. Push Screen A, then Screen B. This screen now has two screens above it, so the activity
          hides and the effect cleanup runs.
        </Text>
        <Text style={styles.instruction}>
          3. Go back twice. The counter keeps its value, cleanup runs is 1, and effect runs is 2.
        </Text>
        <Text style={styles.instruction}>
          4. Push only Screen A and go back. One screen above is below the default threshold of 2,
          so both counts stay unchanged.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    gap: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: 'rgb(11, 103, 175)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
});
