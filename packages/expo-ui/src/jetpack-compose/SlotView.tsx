import { requireNativeView } from 'expo';

type SlotNativeViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotNativeViewProps> = requireNativeView(
  'ExpoUI',
  'SlotView'
);

export function Slot({ slotName, children }: SlotNativeViewProps) {
  return <SlotNativeView slotName={slotName}>{children}</SlotNativeView>;
}
