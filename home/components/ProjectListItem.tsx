import * as React from 'react';
import { View, Linking, Share, StyleSheet, Text } from 'react-native';
import { withNavigation, NavigationInjectedProps } from 'react-navigation';

import Colors from '../constants/Colors';
import UrlUtils from '../utils/UrlUtils';
import { Ionicons } from './Icons';
import ListItem from './ListItem';

type Props = React.ComponentProps<typeof ListItem> &
  NavigationInjectedProps & {
    url: string;
    unlisted?: boolean;
    releaseChannel?: string;
    username?: string;
  };

class ProjectListItem extends React.PureComponent<Props> {
  render() {
    const { url, unlisted, releaseChannel, username, subtitle, ...restProps } = this.props;
    return (
      <ListItem
        onPress={this.handlePress}
        onLongPress={this.handleLongPress}
        rightContent={this.renderRightContent()}
        {...restProps}
        subtitle={username || subtitle}
        onPressSubtitle={username ? this.handlePressUsername : undefined}
      />
    );
  }

  private renderRightContent(): React.ReactNode {
    const { releaseChannel } = this.props;
    return (
      <View style={styles.rightContentContainer}>
        {/* TODO: revisit this when we support "private" - unlisted is }
        {/* {unlisted && this.renderUnlistedIcon()} */}
        {releaseChannel && this.renderReleaseChannel(releaseChannel)}
      </View>
    );
  }

  private renderUnlistedIcon() {
    return (
      <View style={styles.unlistedContainer}>
        <View style={styles.unlistedIconContainer}>
          <Ionicons name="ios-eye-off" size={15} lightColor="rgba(36, 44, 58, 0.3)" />
        </View>
        <Text style={styles.unlistedText}>Unlisted</Text>
      </View>
    );
  }

  private renderReleaseChannel(releaseChannel: string) {
    return (
      <View style={styles.releaseChannelContainer}>
        <Text style={styles.releaseChannelText} numberOfLines={1} ellipsizeMode="tail">
          {releaseChannel}
        </Text>
      </View>
    );
  }

  private handlePress = () => {
    const url = UrlUtils.normalizeUrl(this.props.url);
    Linking.openURL(url);
  };

  private handleLongPress = () => {
    const url = UrlUtils.normalizeUrl(this.props.url);
    Share.share({
      title: this.props.url,
      message: url,
      url,
    });
  };

  private handlePressUsername = () => {
    this.props.navigation.navigate('Profile', { username: this.props.username });
  };
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
