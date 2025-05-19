import { requireNativeView } from 'expo';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type ShapeProps = {
  style: ViewStyle;
};

/**
 * @hidden
 */
export type NativeShapeProps = ShapeProps & {};

// We have to work around the `role` and `onPress` props being reserved by React Native.
const ShapeNativeView: React.ComponentType<NativeShapeProps> = requireNativeView(
  'ExpoUI',
  'ShapeView'
);

/**
 * @hidden
 */
export function transformShapeProps(props: ShapeProps): NativeShapeProps {
  const { ...restProps } = props;
  return {
    ...restProps,
  };
}

/**
 * Displays a native shape component.
 */
export function Shape(props: ShapeProps) {
  return <ShapeNativeView {...transformShapeProps(props)} style={props.style} />;
}
