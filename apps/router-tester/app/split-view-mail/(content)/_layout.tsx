import { ExperimentalStack as Stack } from 'expo-router';

// `SplitView.Content stackIntegration` makes this stack navigate the content column.
export default function ContentLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
