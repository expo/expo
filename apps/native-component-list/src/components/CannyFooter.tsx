import React from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import * as Linking from 'expo-linking';

import Colors from '../constants/Colors';
import Button from './Button';

const cannyUrl = `https://expo.canny.io/feature-requests`;

export default class CannyFooter extends React.Component<{ style?: StyleProp<ViewStyle> }> {
  onPress = () => {
    Linking.openURL(cannyUrl);
  };

  render() {
    return (
      <View style={[styles.container, this.props.style]}>
        <Text style={styles.text}>Missing something?</Text>
        <Button style={styles.button} onPress={this.onPress} title="Open a Canny!" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.tintColor,
  },
  text: {
    color: Colors.secondaryText,
    fontWeight: '700',
    fontSize: 16,
    marginVertical: 12,
  },
});
