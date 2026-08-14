import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { brand, colors } from '@/constants/theme';

type Props = {
  markSize?: number;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  compact?: boolean;
};

/** Horizontal lockup: tetrahedron + MSTRMND */
export function BrandLockup({
  markSize = 28,
  textStyle,
  style,
  glow = false,
  compact = false,
}: Props) {
  return (
    <View style={[styles.row, style]}>
      <BrandMark size={markSize} glow={glow} weight="bold" tone="chrome" />
      <Text style={[compact ? styles.wordCompact : styles.word, textStyle]}>
        {brand.wordmark}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  word: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 22,
    color: colors.chromeHot,
    letterSpacing: 5.5,
  },
  wordCompact: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 16,
    color: colors.chromeHot,
    letterSpacing: 4.2,
  },
});
