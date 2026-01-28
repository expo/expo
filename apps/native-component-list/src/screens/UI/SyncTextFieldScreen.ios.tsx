import { Button, Host, SyncTextField, VStack } from '@expo/ui/swift-ui';
import * as React from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';

export default function SyncTextFieldScreen() {
  const syncTextFieldRef = React.useRef<any>(null);

  const [asyncText, setAsyncText] = React.useState('');
  const onChangeText = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
    setAsyncText(filtered);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync vs Async Text Input</Text>
        <Text style={styles.subtitle}>
          Type numbers or special characters to see the difference
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>React Native TextInput (Async)</Text>
        <Text style={styles.hint}>Flickers when filtering invalid chars</Text>
        <TextInput
          value={asyncText}
          onChangeText={onChangeText}
          placeholder="Type here..."
          style={styles.rnInput}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expo UI SyncTextField (Sync)</Text>
        <Text style={styles.hint}>No flicker - filtered on UI thread</Text>
        <Host matchContents>
          <VStack>
            <SyncTextField
              ref={syncTextFieldRef}
              defaultValue="Hello"
              onChangeSync={(value) => {
                'worklet';
                console.log('onChangeSync', value);
                const filtered = value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
                return filtered !== value ? filtered : undefined;
              }}
            />
          </VStack>
        </Host>
      </View>

      <Host matchContents>
        <VStack>
          <Button
            label="Reset Both"
            onPress={() => {
              syncTextFieldRef.current?.setState('');
              setAsyncText('');
            }}
          />
        </VStack>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginBottom: 8,
  },
  rnInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

SyncTextFieldScreen.navigationOptions = {
  title: 'SyncTextField',
};
