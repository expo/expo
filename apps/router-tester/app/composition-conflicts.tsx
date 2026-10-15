import { Stack } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';

export default function CompositionConflictsScreen() {
  // Competing Titles
  const [showTitleA, setShowTitleA] = useState(false);
  const [showTitleB, setShowTitleB] = useState(false);

  // Competing Headers
  const [showHeaderA, setShowHeaderA] = useState(false);
  const [showHeaderB, setShowHeaderB] = useState(false);

  // Competing Toolbars
  const [showToolbarA, setShowToolbarA] = useState(false);
  const [showToolbarB, setShowToolbarB] = useState(false);

  // Variant Swap
  const [variant, setVariant] = useState<'A' | 'B'>('A');

  // Rapid Toggle
  const [rapidToggleRunning, setRapidToggleRunning] = useState(false);
  const [rapidToggleCount, setRapidToggleCount] = useState(0);
  const [rapidTitle, setRapidTitle] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rapidToggleRunning) {
      setRapidToggleCount(0);
      intervalRef.current = setInterval(() => {
        setRapidTitle((prev) => !prev);
        setRapidToggleCount((prev) => prev + 1);
      }, 100);

      const timeout = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setRapidToggleRunning(false);
      }, 2000);

      return () => {
        clearTimeout(timeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [rapidToggleRunning]);

  return (
    <>
      <Stack.Screen>
        {/* Competing Titles: A is first in tree, B is second (B wins when both mounted) */}
        {showTitleA && <Stack.Screen.Title>Title A</Stack.Screen.Title>}
        {showTitleB && <Stack.Screen.Title>Title B</Stack.Screen.Title>}

        {/* Competing Headers */}
        {showHeaderA && <Stack.Header style={{ backgroundColor: '#007AFF' }} />}
        {showHeaderB && (
          <Stack.Header blurEffect="systemMaterial" style={{ backgroundColor: '#FF3B30' }} />
        )}

        {/* Competing Toolbars (right placement) */}
        {showToolbarA && (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="star"
              onPress={() => Alert.alert('Toolbar A', 'Star pressed')}
            />
          </Stack.Toolbar>
        )}
        {showToolbarB && (
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              icon="heart"
              onPress={() => Alert.alert('Toolbar B', 'Heart pressed')}
            />
          </Stack.Toolbar>
        )}

        {/* Variant Swap: atomically switch between two BackButton configurations */}
        {variant === 'A' && <Stack.Screen.BackButton>Variant A</Stack.Screen.BackButton>}
        {variant === 'B' && <Stack.Screen.BackButton>Variant B</Stack.Screen.BackButton>}

        {/* Rapid Toggle */}
        {rapidTitle && <Stack.Screen.Title>Rapid!</Stack.Screen.Title>}
      </Stack.Screen>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Composition Conflicts</Text>
        <Text style={styles.subtitle}>
          Tests competing components, replacement, and rapid toggling.
        </Text>

        {/* Competing Titles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competing Titles</Text>
          <Text style={styles.note}>
            Last in tree wins. When both mounted, Title B should show. Removing B should promote A.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Title A ("Title A")</Text>
            <Switch testID="toggle-title-a" value={showTitleA} onValueChange={setShowTitleA} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Title B ("Title B")</Text>
            <Switch testID="toggle-title-b" value={showTitleB} onValueChange={setShowTitleB} />
          </View>
        </View>

        {/* Competing Headers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competing Headers</Text>
          <Text style={styles.note}>
            Header A: blue background. Header B: red background + blur. Last in tree wins.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Header A (blue)</Text>
            <Switch testID="toggle-header-a" value={showHeaderA} onValueChange={setShowHeaderA} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Header B (red + blur)</Text>
            <Switch testID="toggle-header-b" value={showHeaderB} onValueChange={setShowHeaderB} />
          </View>
        </View>

        {/* Competing Toolbars */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competing Right Toolbars</Text>
          <Text style={styles.note}>
            Toolbar A: star icon. Toolbar B: heart icon. Last in tree wins.
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Toolbar A (star)</Text>
            <Switch
              testID="toggle-toolbar-a"
              value={showToolbarA}
              onValueChange={setShowToolbarA}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Toolbar B (heart)</Text>
            <Switch
              testID="toggle-toolbar-b"
              value={showToolbarB}
              onValueChange={setShowToolbarB}
            />
          </View>
        </View>

        {/* Variant Swap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variant Swap (BackButton)</Text>
          <Text style={styles.note}>
            Atomic replacement: single state update unmounts one BackButton and mounts another.
          </Text>
          <View style={styles.segmentedRow}>
            <Pressable
              testID="variant-a-button"
              style={[styles.segmentButton, variant === 'A' && styles.segmentButtonActive]}
              onPress={() => setVariant('A')}>
              <Text style={[styles.segmentText, variant === 'A' && styles.segmentTextActive]}>
                Variant A
              </Text>
            </Pressable>
            <Pressable
              testID="variant-b-button"
              style={[styles.segmentButton, variant === 'B' && styles.segmentButtonActive]}
              onPress={() => setVariant('B')}>
              <Text style={[styles.segmentText, variant === 'B' && styles.segmentTextActive]}>
                Variant B
              </Text>
            </Pressable>
          </View>
          <Text testID="current-variant" style={styles.stateText}>
            Current variant: {variant}
          </Text>
        </View>

        {/* Rapid Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rapid Toggle Stress Test</Text>
          <Text style={styles.note}>
            Toggles a Title component every 100ms for 2 seconds. Should not crash or leave stale
            options.
          </Text>
          <Pressable
            testID="start-rapid-toggle"
            style={[styles.button, rapidToggleRunning && styles.buttonDisabled]}
            onPress={() => {
              if (!rapidToggleRunning) {
                setRapidToggleRunning(true);
              }
            }}
            disabled={rapidToggleRunning}>
            <Text style={styles.buttonText}>
              {rapidToggleRunning ? 'Running...' : 'Start Rapid Toggle'}
            </Text>
          </Pressable>
          <Text testID="rapid-toggle-count" style={styles.stateText}>
            Toggle count: {rapidToggleCount}
          </Text>
          <Text testID="rapid-title-mounted" style={styles.stateText}>
            Title mounted: {rapidTitle ? 'Yes' : 'No'}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instruction}>
            1. Competing Titles: Enable both, verify "Title B" shows. Disable B, verify "Title A"
            shows. Disable both, verify route default.
          </Text>
          <Text style={styles.instruction}>
            2. Competing Headers: Enable both, verify red+blur. Disable B, verify blue. Disable
            both, verify default.
          </Text>
          <Text style={styles.instruction}>
            3. Competing Toolbars: Enable both, verify heart icon. Disable B, verify star. Disable
            both, verify no toolbar items.
          </Text>
          <Text style={styles.instruction}>
            4. Variant Swap: Toggle between A and B, verify clean back button label transition.
          </Text>
          <Text style={styles.instruction}>
            5. Rapid Toggle: Tap start, wait 2s. Verify no crash, final state is consistent.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  note: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  stateText: {
    fontSize: 14,
    marginVertical: 4,
    color: '#333',
  },
  instruction: {
    fontSize: 14,
    marginVertical: 4,
    color: '#666',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 0,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentButtonActive: {
    backgroundColor: '#007AFF',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  segmentTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
