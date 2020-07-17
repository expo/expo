import * as React from 'react';
import { Linking, Share, StyleSheet, Text, View } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import UrlUtils from '../utils/UrlUtils';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> & {
  url: string;
  unlisted?: boolean;
  releaseChannel?: string;
  username?: string;
};

function ProjectListItem({
  navigation,
  releaseChannel,
  unlisted,
  username,
  subtitle,
  url,
  ...props
}: Props) {
  const renderRightContent = (): React.ReactNode => {
    return (
      <View style={styles.rightContentContainer}>
        {/* TODO: revisit this when we support "private" - unlisted is }
        {/* {unlisted && this.renderUnlistedIcon()} */}
        {releaseChannel && renderReleaseChannel(releaseChannel)}
      </View>
    );
  };

  /*
  const renderUnlistedIcon = () => {
    return (
      <View style={styles.unlistedContainer}>
        <View style={styles.unlistedIconContainer}>
          <Ionicons name="ios-eye-off" size={15} lightColor="rgba(36, 44, 58, 0.3)" />
        </View>
        <Text style={styles.unlistedText}>Unlisted</Text>
      </View>
    );
  };
  */

  const renderReleaseChannel = (releaseChannel: string) => {
    return (
      <View style={styles.releaseChannelContainer}>
        <Text style={styles.releaseChannelText} numberOfLines={1} ellipsizeMode="tail">
          {releaseChannel}
        </Text>
      </View>
    );
  };

  const handlePress = () => {
    Linking.openURL(UrlUtils.normalizeUrl(url));
  };

  const handleLongPress = () => {
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: url,
      message,
      url: message,
    });
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
  unlistedContainer: {
    marginEnd: 5,
    marginStart: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlistedBullet: {
    width: 3.5,
    height: 3.5,
    borderRadius: 3.5 / 2,
    marginHorizontal: 6,
  },
  unlistedIconContainer: {
    flexDirection: 'row',
  },
  unlistedText: {
    marginLeft: 3,
    color: Colors.light.greyText,
    fontSize: 13,
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

export default withNavigation(ProjectListItem);
