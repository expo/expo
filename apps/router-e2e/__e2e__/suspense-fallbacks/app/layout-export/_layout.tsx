import { Slot } from 'expo-router';

import { createFallback } from '../../components/suspense';

// Overrides the root layout's fallback for screens in this layout.
export const SuspenseFallback = createFallback('layout-export-fallback');

export default function LayoutExportLayout() {
  return <Slot />;
}
