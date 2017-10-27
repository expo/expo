/* @flow */

import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { WebBrowser } from 'expo';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';

export default class EmptyProfileProjectsNotice extends React.Component {
  render() {
    if (this.props.isOwnProfile) {
      return (
        <View style={styles.container}>
          <Text style={SharedStyles.noticeDescriptionText}>
            Projects that you publish will appear here! Go ahead and publish one, then refresh this
            screen.
          </Text>

          <PrimaryButton plain onPress={this._handleLearnMorePress} fallback={TouchableOpacity}>
            Learn more about publishing
          </PrimaryButton>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Text style={SharedStyles.noticeDescriptionText}>No published projects</Text>
        </View>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://blog.getexponent.com/publishing-on-exponent-790493660d24');
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
