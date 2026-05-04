import { Code } from '@expo/html-elements';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/utils/theme';

type JSONViewProps = {
  value: unknown;
  bordered?: boolean;
  textColor?: string;
};

export function JSONView({ value, bordered = true, textColor }: JSONViewProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(value, deterministicJSONReplacer, 2);

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Code style={[styles.code, { color: textColor ?? theme.text.default }]} selectable>
            {json}
          </Code>
        </View>
      </ScrollView>
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
  code: {
    fontSize: 12,
  },
});
