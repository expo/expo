import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '@/constants/theme';

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

  const scale = Math.min(
    1,
    Math.max(0.55, (width - 48) / MOBILE_WIDTH),
    Math.max(0.55, (height - 48) / MOBILE_HEIGHT),
  );

  return (
    <View style={styles.stage}>
      <View
        style={[
          styles.device,
          {
            width: MOBILE_WIDTH,
            height: MOBILE_HEIGHT,
            transform: [{ scale }],
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
  );
}

const styles = StyleSheet.create({
  native: {
    flex: 1,
    backgroundColor: colors.void,
  },
  stage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  device: {
    backgroundColor: '#0A0A0C',
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#1E1E24',
    overflow: 'hidden',
    shadowColor: '#000',
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
    backgroundColor: '#000',
    marginBottom: 4,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.void,
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
