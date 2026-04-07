import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';

/**
 * Tests that all five Stack composition components survive parent rerenders
 * when their props include unstable references (inline styles, inline
 * callbacks, JSX children arrays). Before the useStableCompositionOption
 * fix, any of these patterns crashed with "Maximum update depth exceeded"
 * on screens with local state.
 *
 * How to verify: tap the counter or type in the input. The render count
 * should increment by 1 each time, not explode. If the fix regresses,
 * the screen crashes on the first state change.
 */
export default function CompositionStabilityScreen() {
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState('');
  const renderCount = useRef(0);
  renderCount.current += 1;

  return (
    <>
      {/* Stack.Header: inline style object (new reference every render) */}
      <Stack.Header style={{ backgroundColor: count % 2 === 0 ? '#f0f0f0' : '#e0e8f0' }} />

      {/* Stack.Screen.Title: JSX-array children via interpolation */}
      <Stack.Screen.Title>Stability: {count}</Stack.Screen.Title>

      {/* Stack.Screen.BackButton: inline style object */}
      <Stack.Screen.BackButton style={{ fontSize: 16 }}>Back</Stack.Screen.BackButton>

      {/* Stack.SearchBar: inline handler (new arrow every render) */}
      <Stack.SearchBar
        placeholder="Type to trigger rerender..."
        onChangeText={(text) => setQuery(text)}
      />

      {/* Stack.Toolbar: inline JSX children array */}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="heart" onPress={() => setCount((c) => c + 1)} />
      </Stack.Toolbar>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Composition Stability</Text>
        <Text style={styles.subtitle}>
          All five composition components use inline unstable props. Tap or type to trigger parent
          rerenders. Render count should stay sane.
        </Text>

        <View style={styles.section}>
          <Text style={styles.label}>Render count</Text>
          <Text testID="stability-render-count" style={styles.value}>
            {renderCount.current}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Counter (tap to increment)</Text>
          <Pressable
            testID="stability-increment"
            onPress={() => setCount((c) => c + 1)}
            style={styles.button}>
            <Text style={styles.buttonText}>{count}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Text input (triggers state on every keystroke)</Text>
          <TextInput
            testID="stability-text-input"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Type here..."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's being tested</Text>
          <Text style={styles.item}>Stack.Header — inline style object</Text>
          <Text style={styles.item}>Stack.Screen.Title — JSX interpolation children</Text>
          <Text style={styles.item}>Stack.Screen.BackButton — inline style object</Text>
          <Text style={styles.item}>Stack.SearchBar — inline onChangeText handler</Text>
          <Text style={styles.item}>Stack.Toolbar — inline JSX children array</Text>
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
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  value: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  item: {
    fontSize: 14,
    color: '#444',
    paddingVertical: 2,
  },
  button: {
    backgroundColor: 'rgb(11, 103, 175)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
});
