/* @flow */

import React from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TouchableNativeFeedback from '@expo/react-native-touchable-native-feedback-safe';

export default class PrimaryButton extends React.Component {
  render() {
    // eslint-disable-next-line no-unused-vars
    let { children, isLoading, plain, style, textStyle, ...props } = this.props;

    return (
      <TouchableNativeFeedback
        fallback={TouchableOpacity}
        {...props}
        activeOpacity={isLoading ? 1 : 0.5}
        style={[plain ? styles.plainButton : styles.button, style]}>
        <Text style={plain ? styles.plainButtonText : styles.buttonText}>{children}</Text>
        {isLoading && this._renderLoading()}
      </TouchableNativeFeedback>
    );
  }

  _renderLoading = () => {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    position: 'absolute',
    top: 0,
    right: 15,
    bottom: 0,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#4e9bde',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
    ...Platform.select({
      android: {
        fontSize: 16,
      },
      ios: {
        fontSize: 15,
        fontWeight: '600',
      },
    }),
  },
  plainButton: {},
  plainButtonText: {
    color: '#0f73b6',
    textAlign: 'center',
    ...Platform.select({
      android: {
        fontSize: 16,
      },
      ios: {
        fontSize: 15,
      },
    }),
  },
});
