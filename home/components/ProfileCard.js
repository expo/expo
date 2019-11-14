/* @flow */

import React from 'react';
import { Image, Keyboard, Platform, StyleSheet, TouchableHighlight, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { withNavigation } from 'react-navigation';

import { StyledButton, StyledView } from '../components/Views';
import { StyledText } from '../components/Text';

@withNavigation
export default class ProfileCard extends React.Component {
  render() {
    let { fullName, username, appCount, isLegacy } = this.props;

    return (
      <View style={this.props.style}>
        <StyledButton
          onPress={this._handlePressProfile}
          fallback={TouchableHighlight}
          style={styles.container}
          underlayColor="#b7b7b7">
          <View style={styles.header}>
            <View style={styles.iconContainer}>{this._maybeRenderPhoto()}</View>
            <View style={styles.infoContainer}>
              <StyledText style={styles.profileNameText} ellipsizeMode="tail" numberOfLines={1}>
                {isLegacy ? username : fullName}
              </StyledText>
              <View style={styles.profileExtraInfoContainer}>
                {!isLegacy && (
                  <StyledText
                    lightColor="rgba(36, 44, 58, 0.4)"
                    darkColor="#ccc"
                    style={styles.profileExtraInfoText}
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    @{username}
                  </StyledText>
                )}
                {!isLegacy && (
                  <StyledView
                    style={styles.bullet}
                    lightBackgroundColor="rgba(36, 44, 58, 0.2)"
                    darkBackgroundColor="#ccc"
                  />
                )}
                <StyledText
                  lightColor="rgba(36, 44, 58, 0.7)"
                  darkColor="#eee"
                  onPress={appCount > 0 ? this._handlePressProjects : null}
                  style={styles.profileExtraInfoText}>
                  {appCount} {appCount === 1 ? 'project' : 'projects'}
                </StyledText>
              </View>
            </View>
          </View>
        </StyledButton>
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
    flexGrow: 1,
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
    marginHorizontal: 6,
  },
  profileExtraInfoText: {
    fontSize: 13,
    lineHeight: 16,
  },
});
