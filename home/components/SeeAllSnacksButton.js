/* @flow */

import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from '@expo/react-native-fade-in-image';
import TouchableNativeFeedback from '@expo/react-native-touchable-native-feedback-safe';
import { take } from 'lodash';

import Colors from '../constants/Colors';

export default class SeeAllProjectsButton extends React.Component {
  static defaultProps = {
    label: 'See all',
    snacks: [],
  };

  render() {
    let { snacks, maxIconCount } = this.props;

    if (!snacks || !snacks.length) {
      return <View />;
    }

    return (
      <TouchableNativeFeedback
        onPress={this.props.onPress}
        underlayColor="#c3c3c3"
        fallback={TouchableHighlight}
        style={styles.container}>
        <Text style={styles.buttonText}>{this.props.label}</Text>
        <View style={styles.arrowIconContainer}>
          <Ionicons
            name="ios-arrow-forward"
            size={22}
            color={Colors.greyText}
            style={{ marginTop: -1, marginLeft: 15 }}
          />
        </View>
      </TouchableNativeFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: Colors.separator,
    paddingTop: 15,
    paddingBottom: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: Colors.blackText,
    fontSize: 15,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
      },
    }),
  },
  arrowIconContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});
