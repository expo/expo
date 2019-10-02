/* @flow */

import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';
import { take } from 'lodash';

import Colors from '../constants/Colors';
import { Ionicons } from './Icons';
import { StyledButton } from './Views';
import { StyledText } from './Text';

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
      <StyledButton
        onPress={this.props.onPress}
        underlayColor="#c3c3c3"
        style={styles.container}
        fallback={TouchableHighlight}>
        <StyledText style={styles.buttonText} lightColor={Colors.light.blackText}>
          {this.props.label}
        </StyledText>
        <View style={styles.appIconContainer}>
          {take(apps, maxIconCount).map((app, i) =>
            app.iconUrl ? (
              <FadeIn key={i} placeholderColor="#eee">
                <Image source={{ uri: app.iconUrl }} style={styles.appIcon} />
              </FadeIn>
            ) : (
              <View key={i} style={styles.appIconPlaceholder} />
            )
          )}

          {otherAppCount > 0 && (
            <View style={styles.projectsNumberContainer}>
              <Text style={styles.projectsNumberText}>+{otherAppCount}</Text>
            </View>
          )}

          <Ionicons
            name="ios-arrow-forward"
            size={22}
            color={Colors.light.greyText}
            style={{ marginTop: -1, marginLeft: 15 }}
          />
        </View>
      </StyledButton>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 15,
    paddingBottom: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
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
  appIconPlaceholder: {
    width: 20,
    height: 20,
    marginRight: 3,
    backgroundColor: '#eee',
  },
  projectsNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.greyText,
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
