import Expo from 'expo';
import React from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import ListButton from '../../components/ListButton';
import { Colors } from '../../constants';

import GLScreens from './GLScreens';

export default class GLScreen extends React.Component {
  static navigationOptions = {
    title: 'Examples of GL use',
  };

  render() {
    return (
      <ScrollView style={{ flex: 1 }}>
        {Object.keys(GLScreens)
          .filter(n => n !== 'GL')
          .map(screenName => (
            <View key={screenName} style={{ padding: 10 }}>
              <ListButton
                onPress={() => this.props.navigation.navigate(screenName)}
                title={GLScreens[screenName].screen.title}
              />
            </View>
          ))}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    flex: 1,
  },
});
