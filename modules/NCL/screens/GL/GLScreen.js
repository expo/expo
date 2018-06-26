import React from 'react';
import { View, ScrollView } from 'react-native';
import ListButton from '../../components/ListButton';

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
