import Constants from 'expo-constants';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../common/ThemeProvider';

const supportsGlass = isLiquidGlassAvailable();

type FooterBarProps = {
  children: ReactNode;
};

export default function FooterBar({ children }: FooterBarProps) {
  const { bottom, left, right } = useSafeAreaInsets();
  const { theme } = useTheme();

  const isRunningInBareExpo = Constants.expoConfig?.slug === 'bare-expo';

  // On iOS the native tab bar in bare-expo overlays the content and exposes
  // its height through the bottom safe area inset, so always pad by it.
  // Android tabs take their own layout space and consume the system inset.
  const bottomInset = Platform.OS !== 'ios' && isRunningInBareExpo ? 0 : bottom;

  const padding = {
    paddingBottom: 16 + bottomInset,
    paddingLeft: 20 + left,
    paddingRight: 20 + right,
  };

  if (supportsGlass) {
    return <GlassView style={[styles.container, padding]}>{children}</GlassView>;
  }

  return (
    <View
      style={[
        styles.container,
        styles.opaqueContainer,
        padding,
        {
          borderTopColor: theme.border.secondary,
          backgroundColor: theme.background.default,
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 16,
  },
  opaqueContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
