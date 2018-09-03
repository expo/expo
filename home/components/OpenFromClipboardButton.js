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
import { Ionicons } from '@expo/vector-icons';
import { withNavigation } from 'react-navigation';
import TouchableNativeFeedbackSafe from '@expo/react-native-touchable-native-feedback-safe';

import Colors from '../constants/Colors';
import UrlUtils from '../utils/UrlUtils';

@withNavigation
export default class OpenFromClipboardButton extends React.Component {
  render() {
    let { fullWidthBorder, clipboardContents, isValid } = this.props;

    if (!isValid) {
      if (Platform.OS === 'android') {
        return null;
      }

      return (
        <View
          style={[
            styles.container,
            styles.infoContainer,
            styles.invalidContainer,
            styles.bottomBorder,
          ]}>
          <Text style={styles.subtitleText} ellipsizeMode="tail" numberOfLines={1}>
            {isValid ? clipboardContents : 'Press ⌘+v to move clipboard to simulator'}
          </Text>
        </View>
      );
    }

    return (
      <TouchableNativeFeedbackSafe
        onPress={this._handlePressAsync}
        fallback={TouchableHighlight}
        underlayColor="#b7b7b7"
        style={[styles.container, styles.bottomBorder]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'ios-open' : 'md-open'}
            size={28}
            color="#888"
          />
        </View>

        <View style={styles.infoContainer}>
          <Text
            style={[styles.titleText, !isValid && styles.invalidContents]}
            ellipsizeMode="tail"
            numberOfLines={1}>
            Open from Clipboard
          </Text>

          <Text style={styles.subtitleText} ellipsizeMode="tail" numberOfLines={1}>
            {clipboardContents}
          </Text>
        </View>
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
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingLeft: 5,
    flex: 1,
  },
  iconContainer: {
    width: 50,
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
    color: Colors.blackText,
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
    color: Colors.greyText,
    fontSize: 13,
  },
  invalidContainer: {
    paddingLeft: 20,
  },
});
