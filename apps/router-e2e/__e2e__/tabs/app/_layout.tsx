import { NewTabs, TabList, TabSlot, TabTrigger } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function Layout() {
  return (
    <NewTabs>
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
    </NewTabs>
  );
}
