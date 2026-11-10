import { useGlobalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

export async function generateStaticParams() {
  return ['welcome-to-the-universe', 'other'].map((post) => ({ post }));
}

export default function CatchAllPostRoute() {
  const params = useGlobalSearchParams();
  return (
    <Page title="Catch-all post" testID="rendering-catch-all">
      <Text testID="post-text" style={styles.text}>
        Post: {params.post}
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
