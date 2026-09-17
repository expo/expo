import { Slot } from 'expo-router';

// No fallback is configured here, so screens inherit the root layout's export.
export default function InheritedLayout() {
  return <Slot />;
}
