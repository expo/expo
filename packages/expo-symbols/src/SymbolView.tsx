import { Platform, requireNativeViewManager } from 'expo-modules-core';

import { NativeSymbolViewProps, SymbolViewProps } from './SymbolModule.types';

const NativeView: React.ComponentType<NativeSymbolViewProps> =
  requireNativeViewManager('ExpoSymbols');

export function SymbolView(props: SymbolViewProps) {
  const nativeProps = getNativeProps(props);
  return <NativeView {...nativeProps} />;
}

function getNativeProps(props: SymbolViewProps): NativeSymbolViewProps {
  const colors = Array.isArray(props.colors) ? props.colors : props.colors ? [props.colors] : [];
  const animated = !!props.animationSpec || false;
  const type = props.type || 'monochrome';
  const size = props.size || 24;
  const name = (Platform.OS === 'ios' ? props.iosName : props.androidName) ?? '';
  const style = props.style
    ? [{ width: size, height: size }, props.style]
    : { width: size, height: size };

  return {
    ...props,
    name,
    style,
    colors,
    animated,
    type,
  };
}
