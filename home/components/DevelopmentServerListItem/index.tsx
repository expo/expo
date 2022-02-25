import { ChevronDownIcon, spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Text, useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet, ViewStyle, Pressable, Share, Linking } from 'react-native';

import { ProfileStackRoutes } from '../../navigation/Navigation.types';
import * as UrlUtils from '../../utils/UrlUtils';
import { useSDKExpired } from '../../utils/useSDKExpired';
import Badge from '../Badge';
import { Ionicons } from '../Icons';
import PlatformIcon from '../PlatformIcon';
import { DevelopmentServerImage } from './DevelopmentServerImage';
import { DevelopmentServerSubtitle } from './DevelopmentServerSubtitle';
import { DevelopmentServerTitle } from './DevelopmentServerTitle';

type Props = {
  style?: ViewStyle;
  imageSize?: number;
  onPress?: () => any;
  onLongPress?: () => any;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  onPressSubtitle?: () => any;
  renderExtraText?: () => any;
  margins?: boolean;
  icon?: IconProps['name'];
  iconStyle?: IconProps['style'];
  image?: number | string | null;
  imageStyle?: ViewStyle;
  arrowForward?: boolean;
  rightContent?: React.ReactNode;
  platform?: PlatformIconProps['platform'];
  url: string;
  releaseChannel?: string;
  username?: string;
  sdkVersion?: string;
  experienceInfo?: {
    id: string;
    username: string;
    slug: string;
  };
};

type IconProps = React.ComponentProps<typeof Ionicons>;
type PlatformIconProps = React.ComponentProps<typeof PlatformIcon>;

export function DevelopmentServerListItem({
  username,
  subtitle,
  title,
  url,
  releaseChannel,
  sdkVersion,
  icon,
  iconStyle,
  image,
  experienceInfo,
  disabled,
  platform,
  style,
  onPressSubtitle,
}: Props) {
  const theme = useExpoTheme();
  const navigation = useNavigation<NavigationProp<ProfileStackRoutes>>();
  const [isExpired, sdkVersionNumber] = useSDKExpired(sdkVersion);

  const handlePress = () => {
    if (experienceInfo) {
      navigation.navigate('Project', { id: experienceInfo.id });
    } else if (url) {
      Linking.openURL(UrlUtils.normalizeUrl(url));
    }
  };

  const handleLongPress = () => {
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      android_disableSound
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.container,
        style,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
      disabled={disabled}>
      <DevelopmentServerImage icon={icon} image={image} iconStyle={iconStyle} />
      <RNView style={[styles.contentContainer]}>
        <RNView style={[styles.textContainer]}>
          <DevelopmentServerTitle title={title} platform={platform} />
          <DevelopmentServerSubtitle
            icon={icon}
            title={title}
            subtitle={username ?? subtitle}
            image={image}
            onPressSubtitle={onPressSubtitle}
          />
          {sdkVersionNumber ? (
            <Text color="secondary" size="small" style={styles.infoText}>
              SDK {sdkVersionNumber}
              {isExpired ? ': Not supported' : ''}
            </Text>
          ) : null}
          {releaseChannel ? (
            <RNView style={styles.releaseChannel}>
              <Badge text={releaseChannel} />
            </RNView>
          ) : null}
        </RNView>
        <RNView style={styles.chevronRightContainer}>
          <ChevronDownIcon
            style={{ transform: [{ rotate: '-90deg' }] }}
            color={theme.icon.secondary}
          />
        </RNView>
      </RNView>
    </Pressable>
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
    opacity: 0.5,
  },
  contentContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    flexDirection: 'row',
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
