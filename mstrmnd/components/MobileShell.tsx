import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { MarketingFrame } from '@/components/MarketingFrame';
import { color } from '@/tokens';

/** Phone canvas used on web so the controller always reads as mobile */
export const MOBILE_WIDTH = 390;
export const MOBILE_HEIGHT = 844;

type Props = {
  children: ReactNode;
};

export function MobileShell({ children }: Props) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <View style={styles.native}>{children}</View>;
  }

  const wide = width >= 1100;
  const budgetW = wide ? Math.min(420, width * 0.4) : width - 32;
  const budgetH = wide ? height - 64 : Math.max(360, height * 0.58);
  const scale = Math.min(1, budgetW / MOBILE_WIDTH, budgetH / MOBILE_HEIGHT);

  return (
    <MarketingFrame>
      <View
        style={{
          width: MOBILE_WIDTH * scale,
          height: MOBILE_HEIGHT * scale,
        }}
      >
        <View
          style={[
            styles.device,
            {
              width: MOBILE_WIDTH,
              height: MOBILE_HEIGHT,
              transform: [{ scale }],
              transformOrigin: 'top left',
            },
          ]}
        >
          <View style={styles.bezelTop}>
            <View style={styles.notch} />
          </View>
          <View style={styles.screen}>{children}</View>
          <View style={styles.bezelBottom}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </MarketingFrame>
  );
}

const styles = StyleSheet.create({
  native: {
    flex: 1,
    backgroundColor: color.substrate,
  },
  device: {
    backgroundColor: color.surface,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: color.borderHighlight,
    overflow: 'hidden',
    shadowColor: color.substrate,
    shadowOpacity: 0.6,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 22 },
  },
  bezelTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 34,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 30,
    pointerEvents: 'none',
  },
  notch: {
    width: 108,
    height: 24,
    borderRadius: 16,
    backgroundColor: color.substrate,
    marginBottom: 4,
  },
  screen: {
    flex: 1,
    backgroundColor: color.substrate,
    overflow: 'hidden',
  },
  bezelBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    pointerEvents: 'none',
  },
  homeIndicator: {
    width: 108,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
