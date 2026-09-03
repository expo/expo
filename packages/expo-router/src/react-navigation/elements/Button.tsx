import Color from 'color';
import { Platform, StyleSheet } from 'react-native';

import { router } from '../../imperative-api';
import { resolveHref } from '../../link/href';
import useLinkToPathProps from '../../link/useLinkToPathProps';
import type { Href } from '../../types';
import { useTheme } from '../native';
import { PlatformPressable, type Props as PlatformPressableProps } from './PlatformPressable';
import { Text } from './Text';

type ButtonBaseProps = Omit<PlatformPressableProps, 'children'> & {
  variant?: 'plain' | 'tinted' | 'filled';
  color?: string;
  children: string | string[];
};

type ButtonProps = Omit<ButtonBaseProps, 'href'> & {
  href?: Href;
};

const BUTTON_RADIUS = 40;

export function Button({ href, ...rest }: ButtonProps) {
  if (href != null) {
    return <ButtonLink {...rest} href={href} />;
  }

  return <ButtonBase {...rest} />;
}

function ButtonLink({ href, onPress, ...rest }: ButtonProps & { href: Href }) {
  const { href: resolvedHref } = useLinkToPathProps({ href: resolveHref(href) });

  return (
    <ButtonBase
      {...rest}
      href={resolvedHref}
      onPress={(event) => {
        onPress?.(event);
        // `PlatformPressable` prevents unmodified web clicks before calling `onPress`, so a
        // consumer cannot cancel navigation there with `preventDefault`; on native, they can.
        if (Platform.OS === 'web' || !event?.defaultPrevented) {
          router.navigate(href);
        }
      }}
    />
  );
}

function ButtonBase({
  variant = 'tinted',
  color: customColor,
  android_ripple,
  style,
  children,
  ...rest
}: ButtonBaseProps) {
  const { colors, fonts } = useTheme();

  const color = customColor ?? colors.primary;

  let backgroundColor;
  let textColor;

  switch (variant) {
    case 'plain':
      backgroundColor = 'transparent';
      textColor = color;
      break;
    case 'tinted':
      backgroundColor = Color(color).fade(0.85).string();
      textColor = color;
      break;
    case 'filled':
      backgroundColor = color;
      textColor = Color(color).isDark() ? 'white' : Color(color).darken(0.71).string();
      break;
  }

  return (
    <PlatformPressable
      {...rest}
      android_ripple={{
        radius: BUTTON_RADIUS,
        color: Color(textColor).fade(0.85).string(),
        ...android_ripple,
      }}
      pressOpacity={Platform.OS === 'ios' ? undefined : 1}
      hoverEffect={{ color: textColor }}
      style={[{ backgroundColor }, styles.button, style]}>
      <Text style={[{ color: textColor }, fonts.regular, styles.text]}>{children}</Text>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BUTTON_RADIUS,
    borderCurve: 'continuous',
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
