import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(metrics)">
        <NativeTabs.Trigger.Label>Metrics</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gauge.with.needle" md="sync" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="debug">
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" md="info" />
        <NativeTabs.Trigger.Label>Debug</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
