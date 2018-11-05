/* @flow */

import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from '@expo/react-native-fade-in-image';
import TouchableNativeFeedback from '@expo/react-native-touchable-native-feedback-safe';
import { take } from 'lodash';

import Colors from '../constants/Colors';

const MAX_ICON_COUNT = 4;

export default class SeeAllProjectsButton extends React.Component {
  static defaultProps = {
    label: 'See all',
    apps: [],
    maxIconCount: MAX_ICON_COUNT,
  };

  render() {
    let { apps, appCount, maxIconCount } = this.props;

    if (!apps || !apps.length) {
      return <View />;
    }

    let otherAppCount = appCount - Math.min(apps.length, maxIconCount);

    return (
      <TouchableNativeFeedback
        onPress={this.props.onPress}
        underlayColor="#c3c3c3"
        fallback={TouchableHighlight}
        style={styles.container}>
        <Text style={styles.buttonText}>{this.props.label}</Text>
        <View style={styles.appIconContainer}>
          {take(apps, maxIconCount).map((app, i) => (
            <FadeIn key={i} placeholderColor="#eee">
              <Image source={{ uri: app.iconUrl }} style={styles.appIcon} />
            </FadeIn>
          ))}

          {otherAppCount > 0 && (
            <View style={styles.projectsNumberContainer}>
              <Text style={styles.projectsNumberText}>+{otherAppCount}</Text>
            </View>
          )}

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
  appIconContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  appIcon: {
    width: 20,
    height: 20,
    marginRight: 3,
  },
  projectsNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.greyText,
    backgroundColor: 'transparent',
  },
  projectsNumberContainer: {
    height: 20,
    paddingHorizontal: 5,
    backgroundColor: '#eee',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
