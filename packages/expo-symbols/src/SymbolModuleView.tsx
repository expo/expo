import { Platform, requireNativeViewManager } from 'expo-modules-core';

import { NativeSymbolViewProps, SymbolViewProps } from './SymbolModule.types';

const NativeView: React.ComponentType<NativeSymbolViewProps> =
  requireNativeViewManager('SymbolModule');

export default function SymbolView(props: SymbolViewProps) {
  if (Platform.OS === 'android') {
    return <>{props.fallback}</>;
  }
  const nativeProps = getNativeProps(props);
  return <NativeView {...nativeProps} />;
}

function getNativeProps(props: SymbolViewProps): NativeSymbolViewProps {
  const colors = Array.isArray(props.colors) ? props.colors : props.colors ? [props.colors] : [];
  const animated = !!props.animationSpec || false;
  const type = props.type || 'monochrome';

  return {
    ...props,
    colors,
    animated,
    type,
  };
}
