import { ChevronDownIcon, spacing } from '@expo/styleguide-native';
import { Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet, ViewStyle, Share, Image } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as UrlUtils from '../../../utils/UrlUtils';

type Props = {
  style?: ViewStyle;
  disabled?: boolean;
  title?: string;
  url: string;
  onPress?: () => void;
  iconUrl?: string;
};

export function RecentlyOpenedListItem({ title, url, disabled, style, onPress, iconUrl }: Props) {
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
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={handleLongPress}
      style={[styles.container, style, disabled && styles.disabled]}
      disabled={disabled}>
      <RNView style={[styles.contentContainer]}>
        <View style={styles.row}>
          {iconUrl ? <Image source={{ uri: iconUrl }} style={styles.icon} /> : null}
          <Text type="InterSemiBold" ellipsizeMode="tail" numberOfLines={1}>
            {title}
          </Text>
        </View>
        <RNView style={styles.chevronRightContainer}>
          <ChevronDownIcon
            style={{ transform: [{ rotate: '-90deg' }] }}
            color={theme.icon.secondary}
          />
        </RNView>
      </RNView>
    </TouchableOpacity>
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
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  icon: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 8,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
