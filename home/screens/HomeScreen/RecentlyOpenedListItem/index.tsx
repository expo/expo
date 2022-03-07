import { borderRadius, ChevronDownIcon, spacing } from '@expo/styleguide-native';
import { Text, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet, ViewStyle, Share, Platform } from 'react-native';

import { PressableOpacity } from '../../../components/PressableOpacity';
import * as UrlUtils from '../../../utils/UrlUtils';
import { AppIcon } from '../AppIcon';

type Props = {
  style?: ViewStyle;
  disabled?: boolean;
  title?: string;
  image?: number | string | null;
  url: string;
  onPress?: () => void;
};

export function RecentlyOpenedListItem({ title, url, image, disabled, style, onPress }: Props) {
  const theme = useExpoTheme();

  const handleLongPress = () => {
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  };

  return (
    <PressableOpacity
      accessibilityRole="button"
      android_disableSound
      onPress={onPress}
      onLongPress={handleLongPress}
      style={[styles.container, style, disabled && styles.disabled]}
      disabled={disabled}
      borderRadius={borderRadius.large}
      containerProps={{ bg: 'default' }}>
      <AppIcon image={image} />
      <RNView style={[styles.contentContainer]}>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            ...Platform.select({
              ios: {
                fontWeight: '500',
              },
              android: {
                fontWeight: '400',
              },
            }),
          }}
          ellipsizeMode="tail"
          numberOfLines={1}>
          {title}
        </Text>
        <RNView style={styles.chevronRightContainer}>
          <ChevronDownIcon
            style={{ transform: [{ rotate: '-90deg' }] }}
            color={theme.icon.secondary}
          />
        </RNView>
      </RNView>
    </PressableOpacity>
  );
}

const styles = StyleSheet.create({
  infoText: {
    marginTop: spacing[2],
  },
  releaseChannel: {
    marginTop: spacing[2],
  },
  container: {
    flexDirection: 'row',
    padding: spacing[4],
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  contentContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  chevronRightContainer: {
    alignSelf: 'center',
    marginStart: spacing[2],
  },
});
