/* @flow */

import React from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { withNavigation } from 'react-navigation';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';
import { StyledText } from './Text';
import { StyledView } from './Views';
import { Ionicons } from './Icons';

import Colors from '../constants/Colors';
import UrlUtils from '../utils/UrlUtils';

@withNavigation
export default class OpenFromClipboardButton extends React.Component {
  render() {
    let { clipboardContents, isValid } = this.props;

    // Show info for iOS simulator about how to make clipboard contents available
    if (!isValid && Platform.OS === 'ios' && !Constants.isDevice) {
      return (
        <StyledView
          style={[
            styles.container,
            styles.infoContainer,
            styles.invalidContainer,
            styles.bottomBorder,
          ]}>
          <Text style={styles.subtitleText} ellipsizeMode="tail" numberOfLines={1}>
            {isValid ? clipboardContents : 'Press ⌘+v to move clipboard to simulator'}
          </Text>
        </StyledView>
      );
    } else if (!isValid) {
      return null;
    }

    return (
      <TouchableNativeFeedbackSafe
        onPress={this._handlePressAsync}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7"
        style={styles.container}>
        <StyledView style={{ flex: 1, flexDirection: 'row', paddingLeft: 5 }}>
          <View style={styles.iconContainer}>
            <Ionicons name="md-arrow-dropright-circle" size={25} />
          </View>

          <View style={styles.infoContainer}>
            <StyledText
              style={[styles.titleText, !isValid && styles.invalidContents]}
              ellipsizeMode="tail"
              numberOfLines={1}>
              Open from Clipboard
            </StyledText>

            <Text style={styles.subtitleText} ellipsizeMode="tail" numberOfLines={1}>
              {clipboardContents}
            </Text>
          </View>
        </StyledView>
      </TouchableNativeFeedbackSafe>
    );
  }

  _handlePressAsync = async () => {
    // note(brentvatne): navigation should do this automatically
    Keyboard.dismiss();

    let url = UrlUtils.normalizeUrl(this.props.clipboardContents);
    Linking.canOpenURL(url) && Linking.openURL(url);
  };
}

const styles = StyleSheet.create({
  bottomBorder: {
    flexGrow: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  container: {
    flex: 1,
  },
  iconContainer: {
    width: 45,
    paddingRight: 2,
    paddingTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    paddingTop: 13,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 15,
    marginRight: 15,
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
  subtitleText: {
    marginRight: 10,
    flex: 1,
    color: Colors.light.greyText,
    fontSize: 13,
  },
  invalidContainer: {
    paddingLeft: 20,
  },
});
