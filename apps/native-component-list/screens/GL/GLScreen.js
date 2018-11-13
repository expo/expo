import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import ListButton from '../../components/ListButton';

import GLScreens from './GLScreens';

export default class GLScreen extends React.Component {
  static navigationOptions = {
    title: 'Examples of GL use',
  };

  render() {
    return (
      <ScrollView style={styles.container}>
        {Object.keys(GLScreens).map(screenName => (
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
    flex: 1,
  },
});
