/* @flow */

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';
import SharedStyles from '../constants/SharedStyles';

@withNavigation
export default class EmptyProjectsNotice extends React.Component {
  render() {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={SharedStyles.noticeTitleText}>Nothing to see here, yet</Text>

        <Text style={SharedStyles.noticeDescriptionText}>
          This screen is where you’ll be able to open any project you have running in your Expo XDE.
          You’ll also find your recently opened projects here.
        </Text>

        <PrimaryButton onPress={this._handleExplorePress} fallback={TouchableOpacity}>
          Explore Expo projects
        </PrimaryButton>
      </ScrollView>
    );
  }

  _handleExplorePress = () => {
    this.props.navigation.performAction(({ tabs, stacks }) => {
      tabs('main').jumpToTab('explore');
    });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
});
