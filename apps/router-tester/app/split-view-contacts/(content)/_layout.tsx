import { ExperimentalStack as Stack } from 'expo-router';

// `SplitView.Content stackIntegration` makes this stack navigate the content column.
// The bar stays visible but transparent: a hidden bar turns off the swipe-back gesture in screens v5.
export default function ContentLayout() {
  return <Stack screenOptions={{ title: '', headerTransparent: true }} />;
}
