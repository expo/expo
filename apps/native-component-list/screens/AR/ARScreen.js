import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListButton from '../../components/ListButton';
import ARScreens from './ARScreens';

export default class ARScreen extends React.Component {
  static navigationOptions = { title: 'Examples of AR use' };

  render() {
    return (
      <ScrollView style={styles.container}>
        {Object.keys(ARScreens).map(screenName => (
          <View key={screenName} style={styles.element}>
            <ListButton
              onPress={() => this.props.navigation.navigate(screenName)}
              title={ARScreens[screenName].screen.title}
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
  element: {
    padding: 2,
    paddingLeft: 20,
    paddingRight: 20,
  },
});
