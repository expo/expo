import { NativeTabs } from 'expo-router/native-tabs';

export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites" role="favorites" />
      <NativeTabs.Trigger name="search" role="search" automaticallyActivatesSearch>
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
