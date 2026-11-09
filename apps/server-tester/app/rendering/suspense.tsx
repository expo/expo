import { Suspense, use, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

let content: Promise<string> | undefined;

function DelayedContent() {
  content ??= new Promise((resolve) => setTimeout(() => resolve('x'.repeat(30_000)), 25));
  const text = use(content);
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <View testID="resolved-suspense">
      <Text testID="hydration-status" style={styles.text}>
        {mounted ? 'mounted' : 'unmounted'}
      </Text>
      <Text testID="suspense-content" style={styles.content}>
        {text}
        FINAL_SUSPENSE_SENTINEL
      </Text>
      <Pressable testID="increment" onPress={() => setCount(count + 1)}>
        <Text testID="count" style={styles.text}>
          Count: {count}
        </Text>
      </Pressable>
    </View>
  );
}

export default function SuspenseRoute() {
  return (
    <Page title="Suspense" testID="rendering-suspense">
      <Suspense fallback={<Text style={styles.text}>Loading page</Text>}>
        <View testID="suspense-page">
          <Suspense fallback={<Text style={styles.text}>Loading content</Text>}>
            <DelayedContent />
          </Suspense>
        </View>
      </Suspense>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
  content: {
    color: 'green',
  },
});
