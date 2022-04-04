import { View } from 'expo-dev-client-components';
import React, { PropsWithChildren, ComponentProps } from 'react';
import { TouchableOpacityProps } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { GenericTouchableProps } from 'react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchable';

type DCCViewProps = ComponentProps<typeof View>;

type Props = TouchableOpacityProps &
  GenericTouchableProps & {
    activeOpacity?: number;
    borderRadius?: number;
    containerProps?: DCCViewProps;
  };

export function PressableOpacity({
  activeOpacity,
  borderRadius,
  style,
  containerProps,
  ...rest
}: Props) {
  return (
    <BorderRadiusContainer borderRadius={borderRadius} {...containerProps}>
      <TouchableOpacity style={style} {...rest} />
    </BorderRadiusContainer>
  );
}

type BorderRadiusContainerProps = PropsWithChildren<
  {
    borderRadius?: number;
  } & DCCViewProps
>;

function BorderRadiusContainer({
  borderRadius,
  style,
  children,
  ...props
}: BorderRadiusContainerProps) {
  return (
    <View
      {...props}
      style={[borderRadius ? { borderRadius, overflow: 'hidden' } : undefined, style]}>
      {children}
    </View>
  );
}
