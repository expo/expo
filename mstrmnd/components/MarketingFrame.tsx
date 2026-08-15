import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ReactNode } from 'react';
import { BrandLockup } from '@/components/BrandLockup';
import { CinematicBackground } from '@/components/CinematicBackground';
import { GlassCard } from '@/components/GlassCard';
import { ShimmerText } from '@/components/ShimmerText';
import { brand } from '@/constants/theme';
import { color, font, radius, space } from '@/tokens';

type Props = {
  children: ReactNode;
};

const WIDE = 1100;

/**
 * Web marketing stage around the live Expo phone preview.
 * Native apps skip this and render the controller full-screen.
 */
export function MarketingFrame({ children }: Props) {
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const wide = width >= WIDE;

  return (
    <View style={styles.root}>
      <CinematicBackground glowHeight={wide ? 520 : 280} />
      <View style={[styles.inner, !wide && styles.innerNarrow]}>
        <View style={[styles.copy, !wide && styles.copyNarrow]}>
          <BrandLockup markSize={wide ? 36 : 28} glow />
          <ShimmerText style={wide ? styles.headline : styles.headlineNarrow}>
            {brand.tagline}
          </ShimmerText>
          <Text style={styles.lede}>
            Shared Linear tokens — CSS variables on the marketing surface, StyleSheet
            on iOS, Android, and the live controller.
          </Text>
          <View style={[styles.pillars, !wide && styles.pillarsWrap]}>
            {brand.pillars.map((pillar) => (
              <GlassCard key={pillar} style={styles.pillar} padded={false}>
                <Text style={styles.pillarLabel}>{pillar}</Text>
              </GlassCard>
            ))}
          </View>
          <View style={styles.swatches}>
            <Swatch hex={color.substrate} label="Substrate" />
            <Swatch hex={color.surface} label="Surface" />
            <Swatch hex={color.surfaceElevated} label="Elevated" />
            <Swatch hex={color.accent} label="Accent" />
          </View>
        </View>
        <View style={styles.deviceSlot}>{children}</View>
      </View>
    </View>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchChip, { backgroundColor: hex }]} />
      <Text style={styles.swatchLabel}>{label}</Text>
      <Text style={styles.swatchHex}>{hex}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: color.substrate,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 56,
    zIndex: 1,
  },
  innerNarrow: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  copy: {
    flex: 1,
    maxWidth: 520,
    gap: 18,
  },
  copyNarrow: {
    maxWidth: 640,
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  headlineNarrow: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  lede: {
    fontFamily: font.sans,
    color: color.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 440,
  },
  pillars: {
    flexDirection: 'row',
    gap: 10,
  },
  pillarsWrap: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pillar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillarLabel: {
    fontFamily: font.sansMedium,
    color: color.textPrimary,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  swatches: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  swatch: {
    gap: 4,
  },
  swatchChip: {
    width: 36,
    height: 36,
    borderRadius: radius.pad,
    borderWidth: 1,
    borderColor: color.borderMuted,
  },
  swatchLabel: {
    fontFamily: font.sansMedium,
    color: color.textPrimary,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  swatchHex: {
    fontFamily: font.sans,
    color: color.textSecondary,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  deviceSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
