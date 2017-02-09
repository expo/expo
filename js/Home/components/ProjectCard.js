import React from 'react';
import {
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import TouchableNativeFeedbackSafe from '@exponent/react-native-touchable-native-feedback-safe';
import FadeIn from '@exponent/react-native-fade-in-image';
import {
  withNavigation,
} from '@exponent/ex-navigation';

import Colors from '../constants/Colors';
import ExUrls from 'ExUrls';
import LikeButtonContainer from '../containers/LikeButtonContainer';

@withNavigation
export default class ProjectCard extends React.Component {
  render() {
    let {
      id,
      description,
      iconUrl,
      projectName,
      projectUrl,
      username,
      isLikedByMe,
      likeCount,
    } = this.props;

    return (
      <View style={styles.spacerContainer}>
        <TouchableNativeFeedbackSafe
          onPress={this._handlePressProject}
          fallback={TouchableHighlight}
          underlayColor="#b7b7b7"
          style={[styles.container, styles.bottomBorder]}>
          <View>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <FadeIn placeholderColor="#eee">
                  <Image
                    source={{uri: iconUrl}}
                    style={styles.icon}
                  />
                </FadeIn>
              </View>
              <View style={styles.infoContainer}>
                <Text
                  style={styles.projectNameText}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {projectName}
                </Text>
                <View style={styles.projectExtraInfoContainer}>
                  <Text
                    onPress={this._handlePressUsername}
                    style={styles.projectExtraInfoText}
                    ellipsizeMode="tail"
                    numberOfLines={1}>
                    {username}
                  </Text>
                  <View style={styles.bullet} />
                  <Text
                    onPress={() => {}}
                    style={styles.projectExtraInfoText}>
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.body}>
              <Text style={styles.descriptionText}>
                {description}
              </Text>
            </View>
          </View>
        </TouchableNativeFeedbackSafe>

        <LikeButtonContainer
          style={{position: 'absolute', top: 12, right: 12}}
          appId={id}
          liked={isLikedByMe}
        />
      </View>
    );
  }

  _handlePressProject = () => {
    let url = ExUrls.normalizeUrl(this.props.projectUrl);
    Linking.openURL(url);
  }

  _handlePressUsername = () => {
    if (this.props.onPressUsername) {
      this.props.onPressUsername(this.props.username);
    } else {
      this.props.navigator.push('profile', { username: this.props.username });
    }
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  spacerContainer: {
    marginBottom: 15,
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
  icon: {
    width: 40,
    height: 40,
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
  projectNameText: {
    color: Colors.blackText,
    fontSize: 15,
    marginRight: 70,
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
  projectExtraInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 3.5,
    height: 3.5,
    borderRadius: 3.5/2,
    backgroundColor: 'rgba(36, 44, 58, 0.2)',
    marginHorizontal: 6,
  },
  projectExtraInfoText: {
    color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 13,
    lineHeight: 16,
  },
});

