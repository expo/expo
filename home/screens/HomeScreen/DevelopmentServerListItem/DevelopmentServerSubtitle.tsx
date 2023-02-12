import { Text } from 'expo-dev-client-components';
import * as React from 'react';
import { StyleSheet } from 'react-native';

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
    <Text
      color="secondary"
      size="small"
      type="InterRegular"
      style={[
        !title ? styles.subtitleMarginBottom : undefined,
        isCentered ? styles.subtitleCentered : undefined,
      ]}
      onPress={onPressSubtitle}
      ellipsizeMode="tail"
      numberOfLines={title ? 1 : 2}>
      {subtitle}
    </Text>
  ) : null;
}

const styles = StyleSheet.create({
  subtitleMarginBottom: {
    marginBottom: 2,
  },
  subtitleCentered: {
    textAlign: 'center',
    marginEnd: 10,
  },
});
