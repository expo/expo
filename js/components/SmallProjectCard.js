/* @flow */

import React from 'react';
import {
  Image,
  Keyboard,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import UrlUtils from '../utils/UrlUtils';
import FadeIn from '@expo/react-native-fade-in-image';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';

@withNavigation
export default class SmallProjectCard extends React.PureComponent {
  render() {
    let {
      hideUsername,
      likeCount,
      projectName,
      projectUrl,
      username,
      privacy,
      slug,
      releaseChannel,
    } = this.props;

    const isUnlisted = privacy === 'unlisted';
    const renderLikes = typeof likeCount === 'number' && !isUnlisted;

    return (
      <TouchableNativeFeedbackSafe
        onLongPress={this._handleLongPressProject}
        onPress={this._handlePressProject}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7"
        style={[styles.container, this.props.fullWidthBorder && styles.bottomBorder]}>
        <View style={styles.iconContainer}>{this._maybeRenderIcon()}</View>

        <View style={[styles.infoContainer, !this.props.fullWidthBorder && styles.bottomBorder]}>
          <View style={styles.projectNameContainer}>
            <View style={{ flex: 1, flexGrow: 4 }}>
              <Text style={styles.projectNameText} ellipsizeMode="tail" numberOfLines={1}>
                {projectName}
              </Text>
            </View>
            {releaseChannel && releaseChannel !== 'default' ? (
              <View style={{ flex: 1, flexGrow: 2 }}>
                <View style={styles.releaseChannelContainer}>
                  <Text style={styles.releaseChannelText} numberOfLines={1} ellipsizeMode="tail">
                    {releaseChannel}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.projectExtraInfoContainer}>
            <Text
              onPress={username ? this._handlePressUsername : null}
              style={[
                styles.projectExtraInfoText,
                (renderLikes || isUnlisted) && { flexShrink: 4 },
              ]}
              ellipsizeMode="tail"
              numberOfLines={1}>
              {hideUsername ? slug : username || projectUrl}
            </Text>

            {isUnlisted && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.bullet} />
                <View style={styles.unlistedIconContainer}>
                  <Ionicons name="ios-eye-off" size={15} color="rgba(36, 44, 58, 0.3)" />
                </View>

                <Text style={styles.unlistedText}>Unlisted</Text>
              </View>
            )}

            {renderLikes && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.bullet} />
                <Text onPress={() => {}} numberOfLines={1} style={styles.projectExtraInfoText}>
                  {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableNativeFeedbackSafe>
    );
  }

  _maybeRenderIcon = () => {
    let { iconUrl, icon } = this.props;
    let source = icon ? icon : { uri: iconUrl };

    if (iconUrl || icon) {
      return (
        <View style={[styles.iconClipContainer, this.props.iconBorderStyle]}>
          <FadeIn placeholderColor="#eee">
            <Image source={source} style={styles.icon} />
          </FadeIn>
        </View>
      );
    } else {
      return <View style={[styles.icon, { backgroundColor: '#eee' }]} />;
    }
  };

  _handlePressProject = () => {
    let url = UrlUtils.normalizeUrl(this.props.projectUrl);
    Linking.openURL(url);
  };

  _handleLongPressProject = () => {
    let url = UrlUtils.normalizeUrl(this.props.projectUrl);
    Share.share({
      title: this.props.projectName,
      message: url,
      url,
    });
  };

  _handlePressUsername = () => {
    this.props.navigation.navigate('Profile', { username: this.props.username });
  };
}

// note(brentvatne): we need to know this value so we can set the width of
// extra info container so it properly sizes the url / likes, otherwise it
// just overflows. I think this is a yoga bug
const IconPaddingLeft = 15;
const IconPaddingRight = 10;
const IconWidth = 40;

const styles = StyleSheet.create({
  bottomBorder: {
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    flex: 1,
  },
  iconContainer: {
    paddingLeft: IconPaddingLeft,
    paddingRight: IconPaddingRight,
    paddingTop: 12,
    paddingBottom: 10,
  },
  iconClipContainer: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  icon: {
    width: IconWidth,
    height: IconWidth,
    backgroundColor: '#fff',
    borderRadius: 3,
    ...Platform.select({
      android: {
        marginTop: 3,
      },
    }),
  },
  infoContainer: {
    paddingTop: 13,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
  },
  projectNameContainer: {
    flexDirection: 'row',
    marginRight: 10,
    marginBottom: 2,
  },
  projectNameText: {
    color: Colors.blackText,
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
  releaseChannelContainer: {
    alignSelf: 'flex-end',
    marginTop: -1,
    marginLeft: 5,
    paddingRight: 5,
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
  projectExtraInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Layout.window.width - IconPaddingRight - IconPaddingLeft - IconWidth - 10,
  },
  projectExtraInfoText: {
    color: Colors.greyText,
    fontSize: 13,
  },
  bullet: {
    width: 3.5,
    height: 3.5,
    borderRadius: 3.5 / 2,
    backgroundColor: 'rgba(36, 44, 58, 0.2)',
    marginHorizontal: 6,
  },
  unlistedIconContainer: {
    flexDirection: 'row',
  },
  unlistedText: {
    marginLeft: 3,
    color: Colors.greyText,
    fontSize: 13,
  },
});
