import type { Module } from 'test-suite/TestModules';
import TestScreen from 'test-suite/screens/TestScreen';

// these are expo-notifications tests that are meant to be run on device from the notification-tester app
// they test both local and remote notifications

// The array stays in module scope, so that TestScreen runs the tests once.
const preselectedTestModules: Module[] = [require('test-suite/tests/Notifications')];

export default function NotificationTesterScreen() {
  return <TestScreen preselectedTestModules={preselectedTestModules} />;
}
