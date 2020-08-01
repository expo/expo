import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import { useSDKExpired } from '../utils/useSDKExpired';
import { Experience } from './ExperienceView.types';
import * as Icons from './Icons';
import ListItem from './ListItem';
import Colors from '../constants/Colors';
import { StyledText } from './Text';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  unlisted?: boolean;
  releaseChannel?: string;
  username?: string;
  sdkVersion?: string;
  experienceInfo?: Pick<Experience, 'username' | 'slug'>;
};

function ProjectListItem({
  unlisted,
  username,
  subtitle,
  url,
  releaseChannel,
  sdkVersion,
  ...props
}: Props) {
  const navigation = useNavigation();
  const [isExpired, sdkVersionNumber] = useSDKExpired(sdkVersion);

  const renderRightContent = React.useCallback((): React.ReactNode => {
    return (
      <View style={styles.rightContentContainer}>
        {releaseChannel && (
          <View style={styles.releaseChannelContainer}>
            <Text style={styles.releaseChannelText} numberOfLines={1} ellipsizeMode="tail">
              {releaseChannel}
            </Text>
          </View>
        )}
      </View>
    );
  }, [isExpired, releaseChannel]);

  const handlePress = () => {
    // Open the project info page when it's stale.
    if (isExpired && props.experienceInfo) {
      handleLongPress();
      return;
    }
    Linking.openURL(UrlUtils.normalizeUrl(url));
  };

  const handleLongPress = () => {
    navigation.navigate('Experience', props.experienceInfo);
  };

  const handlePressUsername = () => {
    navigation.navigate('Profile', { username });
  };

  const renderSDKInfo = () =>
    sdkVersionNumber ? (
      <StyledText
        lightColor={Colors.light.greyText}
        darkColor={Colors.dark.greyText}
        style={styles.infoText}>
        SDK {sdkVersionNumber}
        {isExpired ? ': Not supported' : ''}
      </StyledText>
    ) : null;

  return (
    <ListItem
      onPress={handlePress}
      onLongPress={handleLongPress}
      rightContent={renderRightContent()}
      {...props}
      renderSDKInfo={renderSDKInfo}
      subtitle={username || subtitle}
      onPressSubtitle={username ? handlePressUsername : undefined}
    />
  );
}

const styles = StyleSheet.create({
  infoText: {
    marginTop: 4,
    fontSize: 12,
  },
  rightContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiredIconContainer: {
    marginRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  releaseChannelContainer: {
    marginEnd: 5,
    marginStart: 5,
    backgroundColor: 'rgba(0,0,0,0.025)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  releaseChannelText: {
    color: '#888',
    fontSize: 11,
  },
});

export default ProjectListItem;
