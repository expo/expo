/* @flow */

import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import { StyledView } from './Views';
import { StyledText } from './Text';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';

export default class EmptyProfileSnacksNotice extends React.Component {
  render() {
    if (this.props.isOwnProfile) {
      return (
        <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
          <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            Snacks that you save to your profile will appear here!
          </StyledText>

          <PrimaryButton
            plain
            onPress={this._handleLearnMorePress}
            fallback={TouchableOpacity}
            style={{ marginBottom: 5 }}>
            Learn more about Snack
          </PrimaryButton>
        </StyledView>
      );
    } else {
      return (
        <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
          <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            No saved Snacks
          </StyledText>
        </StyledView>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://snack.expo.io');
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
