import { NativeTabs } from 'expo-router/native-tabs';

/**
 * Beside the iPhone Duo rail, the tab bar when the app runs in the left window of a split view,
 * iOS drops its content margin: the large title starts on the safe-area edge. A SwiftUI `Form` or
 * `List` in a `Host` keeps its section margin there, so its cards start 20pt inside the title.
 * Each tab draws a guide on the safe-area edge; beside the rail the title and the cards should
 * both start on it.
 */
export default function Layout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="form">
        <NativeTabs.Trigger.Label>Form</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="list" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="list">
        <NativeTabs.Trigger.Label>List</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="format_list_bulleted" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
