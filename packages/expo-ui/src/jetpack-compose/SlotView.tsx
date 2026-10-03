import { requireNativeLayoutView } from '../requireNativeLayoutView';

type SlotNativeViewProps = {
  slotName: string;
  children: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotNativeViewProps> = requireNativeLayoutView(
  'ExpoUI',
  'SlotView'
);

export function Slot({ slotName, children }: SlotNativeViewProps) {
  return <SlotNativeView slotName={slotName}>{children}</SlotNativeView>;
}
