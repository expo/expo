import * as React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';

import Colors from '../../../constants/Colors';

type DevelopmentServerSubtitleProps = {
  title?: string;
  subtitle?: string;
  onPressSubtitle?: () => any;
  image?: number | string | null;
};

export function DevelopmentServerSubtitle({
  title,
  subtitle,
  image,
  onPressSubtitle,
}: DevelopmentServerSubtitleProps) {
  const isCentered = !title && !image;

  return subtitle ? (
    <RNText
      style={[
        styles.subtitleText,
        !title ? styles.subtitleMarginBottom : undefined,
        isCentered ? styles.subtitleCentered : undefined,
      ]}
      onPress={onPressSubtitle}
      ellipsizeMode="tail"
      numberOfLines={title ? 1 : 2}>
      {subtitle}
    </RNText>
  ) : null;
}

const styles = StyleSheet.create({
  subtitleText: {
    color: Colors.light.greyText,
    fontSize: 13,
  },
  subtitleMarginBottom: {
    marginBottom: 2,
  },
  subtitleCentered: {
    textAlign: 'center',
    marginEnd: 10,
  },
});
