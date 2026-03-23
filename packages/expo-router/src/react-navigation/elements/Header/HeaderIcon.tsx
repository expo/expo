import { useLocale, useTheme } from '@react-navigation/native';
import { Image, type ImageProps, Platform, StyleSheet } from 'react-native';

export function HeaderIcon({ source, style, ...rest }: ImageProps) {
  const { colors } = useTheme();
  const { direction } = useLocale();

  return (
    <Image
      source={source}
      resizeMode="contain"
      fadeDuration={0}
      tintColor={colors.text}
      style={[styles.icon, direction === 'rtl' && styles.flip, style]}
      {...rest}
    />
  );
}

export const ICON_SIZE = Platform.OS === 'ios' ? 21 : 24;
export const ICON_MARGIN = Platform.OS === 'ios' ? 8 : 3;

const styles = StyleSheet.create({
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    margin: ICON_MARGIN,
  },
  flip: {
    transform: 'scaleX(-1)',
  },
});
