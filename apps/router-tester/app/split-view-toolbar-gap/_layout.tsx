import { SplitView } from 'expo-router/unstable-split-view';
import { ScrollView, StyleSheet, Text } from 'react-native';

export default function Layout() {
  return (
    <SplitView
      columnMetrics={{
        minimumPrimaryColumnWidth: 220,
        preferredPrimaryColumnWidth: 240,
        maximumPrimaryColumnWidth: 280,
        minimumSupplementaryColumnWidth: 280,
        preferredSupplementaryColumnWidth: 320,
        maximumSupplementaryColumnWidth: 360,
      }}
      implementation="expo-ui"
      preferredDisplayMode="twoBesideSecondary"
      preferredSplitBehavior="tile">
      <SplitView.Column title="Sidebar" headerLargeTitle={false}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text>Sidebar content</Text>
        </ScrollView>
      </SplitView.Column>
      <SplitView.Column title="Content" headerLargeTitle={false}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text>Content content</Text>
        </ScrollView>
      </SplitView.Column>
      <SplitView.Screen name="index" options={{ headerShown: false }} />
      <SplitView.Screen name="[id]" options={{ headerShown: false }} />
    </SplitView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
});
