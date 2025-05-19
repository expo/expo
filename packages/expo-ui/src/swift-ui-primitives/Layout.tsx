import { requireNativeView } from 'expo';

type StackBaseProps = {
  children: React.ReactNode;
  spacing?: number;
  padding?: number;
  frame?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
};

//#region HStack Component
export type HStackProps = StackBaseProps;
const HStackNativeView: React.ComponentType<HStackProps> = requireNativeView(
  'ExpoUI',
  'HStackView'
);
export function HStack(props: HStackProps) {
  return <HStackNativeView {...props} />;
}
//#endregion

//#region VStack Component
export type VStackProps = StackBaseProps;
const VStackNativeView: React.ComponentType<VStackProps> = requireNativeView(
  'ExpoUI',
  'VStackView'
);
export function VStack(props: VStackProps) {
  return <VStackNativeView {...props} />;
}
//#endregion
