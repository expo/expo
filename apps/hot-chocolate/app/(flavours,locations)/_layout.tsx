import { Stack } from 'expo-router';

import { SystemScreenStackPreset } from '@/components/StackPreset';
import { TabsAwareView } from '@/components/TabsAwareView';

export default function RootLayout() {
  return (
    <TabsAwareView>
      <Stack screenOptions={SystemScreenStackPreset} />
    </TabsAwareView>
  );
}
