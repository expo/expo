/* @flow */

import React from 'react';
import {
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';
import FadeIn from '@expo/react-native-fade-in-image';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';

@withNavigation
export default class ProfileCard extends React.Component {
  render() {
    let { fullName, username, appCount, isLegacy } = this.props;

    return (
      <View style={this.props.style}>
        <TouchableNativeFeedbackSafe
          onPress={this._handlePressProfile}
          fallback={TouchableHighlight}
          underlayColor="#b7b7b7"
          style={[styles.container, styles.bottomBorder]}>
          <View>
            <View style={styles.header}>
              <View style={styles.iconContainer}>{this._maybeRenderPhoto()}</View>
              <View style={styles.infoContainer}>
                <Text style={styles.profileNameText} ellipsizeMode="tail" numberOfLines={1}>
                  {isLegacy ? username : fullName}
                </Text>
                <View style={styles.profileExtraInfoContainer}>
                  {!isLegacy && (
                    <Text
                      style={styles.profileExtraInfoText}
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      @{username}
                    </Text>
                  )}
                  {!isLegacy && <View style={styles.bullet} />}
                  <Text
                    onPress={appCount > 0 ? this._handlePressProjects : null}
                    style={styles.profileExtraInfoText}>
                    {appCount} {appCount === 1 ? 'project' : 'projects'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableNativeFeedbackSafe>
      </View>
    );
  }

  _maybeRenderPhoto = () => {
    let { profilePhoto } = this.props;

    if (profilePhoto) {
      return (
        <View style={styles.iconClipContainer}>
          <FadeIn placeholderColor="#eee">
            <Image source={{ uri: profilePhoto }} style={styles.icon} />
          </FadeIn>
        </View>
      );
    } else {
      return <View style={[styles.icon, { backgroundColor: '#eee' }]} />;
    }
  };

  _handlePressProjects = () => {
    // note(brentvatne): navigation should do this automatically
    // Keyboard.dismiss();

    this.props.navigation.navigate('ProjectsForUser', {
      username: this.props.username,
    });
  };

  _handlePressProfile = () => {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    if (this.props.onPressUsername) {
      this.props.onPressUsername(this.props.username);
    } else {
      this.props.navigation.navigate('Profile', { username: this.props.username });
    }
  };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  body: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 17,
  },
  iconContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 10,
  },
  descriptionText: {
    color: 'rgba(36, 44, 58, 0.7)',
    lineHeight: 19,
  },
  iconClipContainer: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  icon: {
    width: 40,
    height: 40,
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
  profileNameText: {
    color: Colors.blackText,
    fontSize: 15,
    marginRight: 170,
    marginBottom: 2,
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
  profileExtraInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 3.5,
    height: 3.5,
    borderRadius: 3.5 / 2,
    backgroundColor: 'rgba(36, 44, 58, 0.2)',
    marginHorizontal: 6,
  },
  profileExtraInfoText: {
    color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 13,
    lineHeight: 16,
  },
});
