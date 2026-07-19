import { Code } from '@expo/html-elements';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

type JSONViewProps = {
  value: unknown;
  bordered?: boolean;
  textColor?: string;
  /** Hides the floating "Copy" button when set to `false`. */
  showCopyButton?: boolean;
};

export function JSONView({
  value,
  bordered = true,
  textColor,
  showCopyButton = true,
}: JSONViewProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(value, deterministicJSONReplacer, 2);

  // Render one `Code` per line rather than a single node for the whole document. A lone giant Text
  // node (e.g. a serialized stack trace, which is one ~40KB line since its newlines are escaped)
  // blanks out in React Native's text layout; splitting keeps each node small. Lines wrap instead of
  // scrolling horizontally so even a long single-value line stays visible, and the block is capped
  // and vertically scrollable so one big value can't fill the screen.
  const lines = json.split('\n');

  return (
    <View
      style={[
        bordered && styles.container,
        bordered && {
          backgroundColor: theme.background.element,
          borderColor: theme.border.default,
          borderWidth: 1,
        },
      ]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator nestedScrollEnabled>
        {lines.map((line, index) => (
          <Code
            key={index}
            style={[styles.code, { color: textColor ?? theme.text.default }]}
            selectable>
            {line}
          </Code>
        ))}
      </ScrollView>
      {showCopyButton ? (
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={({ pressed }) => [
            styles.copyButton,
            {
              backgroundColor: theme.background.element,
              borderColor: theme.border.default,
            },
            pressed && styles.copyButtonPressed,
          ]}>
          <Text style={[styles.copyButtonText, { color: theme.text.secondary }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// JSON.stringify replacer that yields a stable key order across runs.
function deterministicJSONReplacer(_: string, value: any) {
  return typeof value !== 'object' || value === null || Array.isArray(value)
    ? value
    : Object.fromEntries(
        Object.entries(value).sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
      );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 12,
  },
  copyButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
  },
  copyButtonPressed: {
    opacity: 0.5,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    maxHeight: 240,
  },
  code: {
    fontSize: 12,
  },
});
