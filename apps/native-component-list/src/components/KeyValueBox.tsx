import { Code } from '@expo/html-elements';
import * as Clipboard from 'expo-clipboard';
import { ScrollView, StyleSheet, ViewStyle, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  style?: ViewStyle;
  entries: Record<string, string | number | boolean | null | undefined>;
  title: string;
};

export function KeyValueBox({ entries, style, title }: Props) {
  const handleCopyAssertVisible = async () => {
    const assertVisibleStrings = Object.entries(entries).map(([key, value]) => {
      const label = `${key} = ${String(value)}`;
      return `- assertVisible: '${label}'`;
    });

    const copyText = assertVisibleStrings.join('\n');
    await Clipboard.setStringAsync(copyText);
  };

  return (
    <>
      <View style={styles.headerRow}>
        <Text
          style={{
            fontWeight: 'bold',
            opacity: 0.5,
            fontSize: 12,
            flex: 1,
            textAlign: 'left',
          }}>
          {title}
        </Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAssertVisible}>
          <Text style={styles.copyButtonText}>Copy maestro assertions</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={[styles.scrollView, style]}
        indicatorStyle="black"
        contentContainerStyle={styles.contentContainer}>
        {Object.entries(entries).map(([key, value]) => {
          const label = `${key} = ${String(value)}`;
          return (
            <Code style={styles.monoText} key={label}>
              {label}
            </Code>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scrollView: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#666',
  },
  contentContainer: {
    padding: 6,
  },
  monoText: {
    fontSize: 10,
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
