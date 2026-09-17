import { Slot } from 'expo-router';

// `null` stops inheriting the root layout's export and uses the built-in fallback.
export default function ResetLayout() {
  return <Slot suspenseFallback={null} />;
}
