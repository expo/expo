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
          <Text style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            Projects that you publish will appear here! Go ahead and publish one, then refresh this
            screen.
          </Text>

          <PrimaryButton
            plain
            onPress={this._handleLearnMorePress}
            fallback={TouchableOpacity}
            style={{ marginBottom: 5 }}>
            Learn more about publishing
          </PrimaryButton>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Text style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            No published projects
          </Text>
        </View>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/guides/publishing.html');
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
    paddingTop: 5,
    alignItems: 'flex-start',
    paddingHorizontal: 15,
  },
  descriptionText: {
    textAlign: 'left',
    marginHorizontal: 0,
    marginBottom: 10,
    padding: 0,
  },
});
