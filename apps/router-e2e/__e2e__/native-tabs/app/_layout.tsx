import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Index label</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nested">
        <NativeTabs.Trigger.Label>nested</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>1</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dynamic">
        <NativeTabs.Trigger.Label>Dynamic</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge>9</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
