import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';
import { useSDKExpired } from '../utils/useSDKExpired';
import { Experience } from './ExperienceView.types';
import { ExpiredSDK } from './Icons';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  unlisted?: boolean;
  releaseChannel?: string;
  username?: string;
  sdkVersion?: string;
  experienceInfo?: Pick<Experience, 'username' | 'slug'>;
};

function ProjectListItem({
  releaseChannel = 'pr-123',
  unlisted,
  username,
  subtitle,
  url,
  sdkVersion,
  ...props
}: Props) {
  const navigation = useNavigation();
  const isExpired = useSDKExpired(sdkVersion);

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
        {isExpired && (
          <View style={styles.expiredIconContainer}>
            <ExpiredSDK size={24} />
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

  return (
    <ListItem
      onPress={handlePress}
      onLongPress={handleLongPress}
      rightContent={renderRightContent()}
      {...props}
      subtitle={username || subtitle}
      onPressSubtitle={username ? handlePressUsername : undefined}
    />
  );
}

const styles = StyleSheet.create({
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
