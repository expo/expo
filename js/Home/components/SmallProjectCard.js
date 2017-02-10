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
import { withNavigation } from '@exponent/ex-navigation';

import Colors from '../constants/Colors';
import ExUrls from 'ExUrls';
import FadeIn from '@exponent/react-native-fade-in-image';
import TouchableNativeFeedbackSafe from '@exponent/react-native-touchable-native-feedback-safe';

@withNavigation
export default class SmallProjectCard extends React.Component {
  render() {
    let {
      projectName,
      projectUrl,
      username,
      iconUrl,
    } = this.props;

    return (
      <TouchableNativeFeedbackSafe
        onPress={this._handlePressProject}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7"
        style={[styles.container, this.props.fullWidthBorder && styles.bottomBorder]}>
        <View style={styles.iconContainer}>
          {this._maybeRenderIcon()}
        </View>
        <View style={[styles.infoContainer, !this.props.fullWidthBorder && styles.bottomBorder]}>
          <Text
            style={styles.projectNameText}
            ellipsizeMode="tail"
            numberOfLines={1}>
            {projectName}
          </Text>
          <Text
            onPress={username ? this._handlePressUsername : null}
            style={styles.projectExtraInfoText}
            ellipsizeMode="tail"
            numberOfLines={1}>
            {username || projectUrl}
          </Text>
        </View>
      </TouchableNativeFeedbackSafe>
    );
  }

  _maybeRenderIcon = () => {
    let { iconUrl } = this.props;

    if (iconUrl) {
      return (
        <FadeIn placeholderColor="#eee">
          <Image
            source={{uri: iconUrl}}
            style={styles.icon}
          />
        </FadeIn>
      );
    } else {
      return (
        <View style={[styles.icon, {backgroundColor: '#eee'}]} />
      );
    }
  }

  _handlePressProject = () => {
    let url = ExUrls.normalizeUrl(this.props.projectUrl);
    Linking.openURL(url);
  }

  _handlePressUsername = () => {
    this.props.navigator.push('profile', { username: this.props.username });
  }
}

const styles = StyleSheet.create({
  bottomBorder: {
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  iconContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    paddingTop: 12,
    paddingBottom: 10,
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
  projectExtraInfoText: {
    color: Colors.greyText,
    fontSize: 13,
    marginRight: 70,
    paddingRight: 30,
  },
});

