import { useExpoTheme, View } from 'expo-dev-client-components';
import React, { PropsWithChildren, ComponentProps } from 'react';
import { PressableProps, Pressable, Platform } from 'react-native';

type DCCViewProps = ComponentProps<typeof View>;

type Props = PressableProps & {
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
  const theme = useExpoTheme();

  return (
    <BorderRadiusContainer borderRadius={borderRadius} {...containerProps}>
      <Pressable
        style={({ pressed }) => {
          const pressedStyles = typeof style === 'function' ? style({ pressed }) : style;

          const pressedOpacity = Platform.OS !== 'android' ? activeOpacity ?? 0.2 : 1;

          const nativeStyle = {
            opacity: pressed ? pressedOpacity : 1,
            borderRadius,
          };

          if (Array.isArray(pressedStyles)) {
            return [nativeStyle, ...pressedStyles];
          }
          return [nativeStyle, pressedStyles];
        }}
        android_ripple={{ color: theme.text.default, borderless: false }}
        {...rest}
      />
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
      style={[borderRadius ? { borderRadius, overflow: 'hidden' } : undefined, style]}
      {...props}>
      {children}
    </View>
  );
}
