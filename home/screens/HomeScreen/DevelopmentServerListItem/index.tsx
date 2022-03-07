import { ChevronDownIcon, spacing } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import { View as RNView, StyleSheet, ViewStyle, Share, Linking } from 'react-native';

import PlatformIcon from '../../../components/PlatformIcon';
import { PressableOpacity } from '../../../components/PressableOpacity';
import { ProfileStackRoutes } from '../../../navigation/Navigation.types';
import * as UrlUtils from '../../../utils/UrlUtils';
import { AppIcon } from '../AppIcon';
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
  image?: number | string | null;
  imageStyle?: ViewStyle;
  arrowForward?: boolean;
  rightContent?: React.ReactNode;
  platform?: PlatformIconProps['platform'];
  url: string;
  username?: string;
  experienceInfo?: {
    id: string;
    username: string;
    slug: string;
  };
};

type PlatformIconProps = React.ComponentProps<typeof PlatformIcon>;

export function DevelopmentServerListItem({
  username,
  subtitle,
  title,
  url,
  image,
  experienceInfo,
  disabled,
  platform,
  style,
  onPressSubtitle,
}: Props) {
  const theme = useExpoTheme();
  const navigation = useNavigation<NavigationProp<ProfileStackRoutes>>();

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
    <PressableOpacity
      accessibilityRole="button"
      android_disableSound
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[styles.container, style, disabled && styles.disabled]}
      disabled={disabled}>
      <AppIcon image={image} />
      <RNView style={[styles.contentContainer]}>
        <RNView style={[styles.textContainer]}>
          <DevelopmentServerTitle title={title} platform={platform} />
          <DevelopmentServerSubtitle
            title={title}
            subtitle={username ?? subtitle}
            image={image}
            onPressSubtitle={onPressSubtitle}
          />
        </RNView>
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
