import { ExperimentalStack as Stack } from 'expo-router';

import { findSection } from '@/components/split-view-settings';

// `SplitView.Content stackIntegration` makes this stack navigate the content column.
export default function ContentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen
        name="[section]/index"
        options={({ route }) => ({
          // The `[section]` route always has the `section` param.
          title: findSection((route.params as { section: string }).section)?.title,
        })}
      />
      <Stack.Screen
        name="[section]/[item]"
        options={({ route }) => ({
          // The `[item]` route always has the `item` param.
          title: (route.params as { item: string }).item,
        })}
      />
    </Stack>
  );
}
