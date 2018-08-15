/* @flow */

import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { WebBrowser } from 'expo';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';

export default class EmptyProfileSnacksNotice extends React.Component {
  render() {
    if (this.props.isOwnProfile) {
      return (
        <View style={styles.container}>
          <Text style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            Snacks that you save to your profile will appear here!
          </Text>

          <PrimaryButton
            plain
            onPress={this._handleLearnMorePress}
            fallback={TouchableOpacity}
            style={{ marginBottom: 5 }}>
            Learn more about Snack
          </PrimaryButton>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Text style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            No saved Snacks
          </Text>
        </View>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/workflow/snack');
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
