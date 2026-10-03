import { requireNativeLayoutView } from '../requireNativeLayoutView';

type SlotProps<ExtraProps extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  extraProps?: ExtraProps;
  children?: React.ReactNode;
};

const SlotNativeView: React.ComponentType<SlotProps> = requireNativeLayoutView(
  'ExpoUI',
  'SlotView'
);

export function Slot<ExtraProps extends Record<string, unknown> = Record<string, unknown>>({
  name,
  extraProps,
  children,
}: SlotProps<ExtraProps>) {
  return (
    <SlotNativeView name={name} extraProps={extraProps}>
      {children}
    </SlotNativeView>
  );
}
