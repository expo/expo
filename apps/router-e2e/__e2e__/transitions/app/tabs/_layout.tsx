import { NativeTabs } from 'expo-router/unstable-native-tabs';

// Native tabs to exercise D5: a native tab press dispatches JUMP_TO urgently. Used to characterize
// native-urgent interleaving against a pending JS push (spike item f, supersede-over-flush).
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index" testID="tab-one">
        <NativeTabs.Trigger.Label>One</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="two" testID="tab-two">
        <NativeTabs.Trigger.Label>Two</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
