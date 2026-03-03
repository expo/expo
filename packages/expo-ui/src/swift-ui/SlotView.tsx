import { requireNativeView } from 'expo';

const SlotNativeView: React.ComponentType<{ name: string; children?: React.ReactNode }> =
  requireNativeView('ExpoUI', 'SlotView');

export function Slot({ name, children }: { name: string; children?: React.ReactNode }) {
  return <SlotNativeView name={name}>{children}</SlotNativeView>;
}
