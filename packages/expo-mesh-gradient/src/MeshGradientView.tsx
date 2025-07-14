import { requireNativeView } from 'expo';
import { Platform, processColor, ProcessedColorValue } from 'react-native';

import { MeshGradientViewProps } from './MeshGradient.types';

const NativeView = requireNativeView<
  Omit<MeshGradientViewProps, 'colors'> & {
    colors?: (ProcessedColorValue | null | undefined)[];
  }
>('ExpoMeshGradient');

const MeshGradientView = (props: MeshGradientViewProps) => {
  const { colors, children, ...restProps } = props;
  return (
    <NativeView
      {...restProps}
      colors={colors?.map((color) => processColor(color))}
      children={Platform.OS !== 'android' ? children : undefined}
    />
  );
};

export default MeshGradientView;
