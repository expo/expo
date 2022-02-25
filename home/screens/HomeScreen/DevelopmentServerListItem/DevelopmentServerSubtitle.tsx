import * as React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';

import { Ionicons } from '../../../components/Icons';
import Colors from '../../../constants/Colors';

type IconProps = React.ComponentProps<typeof Ionicons>;

type DevelopmentServerSubtitleProps = {
  title?: string;
  subtitle?: string;
  icon?: IconProps['name'];
  onPressSubtitle?: () => any;
  image?: number | string | null;
};

export function DevelopmentServerSubtitle({
  title,
  subtitle,
  icon,
  image,
  onPressSubtitle,
}: DevelopmentServerSubtitleProps) {
  const isCentered = !title && !icon && !image;

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
