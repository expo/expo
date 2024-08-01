import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/headless';
import { Text } from 'react-native';

export default function Layout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList>
        <TabTrigger href="/">
          <Text>Index</Text>
        </TabTrigger>
        <TabTrigger href="/test">
          <Text>Test</Text>
        </TabTrigger>
        <TabTrigger href="http://www.google.com">
          <Text>External</Text>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
