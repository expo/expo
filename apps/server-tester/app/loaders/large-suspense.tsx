import { useLoaderData } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

export async function loader() {
  return {
    rows: Array.from({ length: 400 }, (_, id) => ({
      id,
      label: `Row ${id} of 400, carrying enough text that a few hundred of them add up`,
    })),
  };
}

export default function LargeSuspenseRoute() {
  const { rows } = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);
  const mounted = useIsMounted();

  return (
    <Page title="Large Suspense content" testID="loaders-large-suspense">
      <View testID="suspense-content">
        <Button testID="suspense-increment" title="Increment" onPress={() => setCount(count + 1)} />
        <Text testID="suspense-count" style={styles.text}>
          {count}
        </Text>
        {rows.map((row) => (
          <Text key={row.id} testID="suspense-row" style={styles.text}>
            {row.label}
          </Text>
        ))}
        <Text testID="suspense-content-end" style={styles.text}>
          End of loader rows
        </Text>
        {mounted && (
          <Text testID="suspense-mounted" style={styles.text}>
            Mounted
          </Text>
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
