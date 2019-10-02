/* @flow */

import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import { StyledView } from './Views';
import { StyledText } from './Text';
import SharedStyles from '../constants/SharedStyles';
import PrimaryButton from './PrimaryButton';

export default class EmptyProfileProjectsNotice extends React.Component {
  render() {
    if (this.props.isOwnProfile) {
      return (
        <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
          <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            Projects that you publish will appear here! Go ahead and publish one, then refresh this
            screen.
          </StyledText>

          <PrimaryButton
            plain
            onPress={this._handleLearnMorePress}
            fallback={TouchableOpacity}
            style={{ marginBottom: 5 }}>
            Learn more about publishing
          </PrimaryButton>
        </StyledView>
      );
    } else {
      return (
        <StyledView style={styles.container} lightBackgroundColor={Colors.light.greyBackground}>
          <StyledText style={[SharedStyles.noticeDescriptionText, styles.descriptionText]}>
            No published projects
          </StyledText>
        </StyledView>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/workflow/publishing/');
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
