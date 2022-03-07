import { useExpoTheme, View } from 'expo-dev-client-components';
import React, { PropsWithChildren } from 'react';
import { PressableProps, Pressable, Platform, ViewStyle } from 'react-native';

type Props = PressableProps & {
  activeOpacity?: number;
  borderRadius?: number;
  containerStyle?: ViewStyle;
};

export function PressableOpacity({
  activeOpacity,
  borderRadius,
  style,
  containerStyle,
  ...rest
}: Props) {
  const theme = useExpoTheme();

  return (
    <BorderRadiusContainer borderRadius={borderRadius} style={containerStyle}>
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
  } & React.ComponentProps<typeof View>
>;

function BorderRadiusContainer({
  borderRadius,
  style,
  children,
  ...props
}: BorderRadiusContainerProps) {
  if (!borderRadius) return <>{children}</>;

  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]} {...props}>
      {children}
    </View>
  );
}
