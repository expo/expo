import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import ListButton from '../../components/ListButton';
import ARScreens from './ARScreens';

export default class ARScreen extends React.Component {
  static navigationOptions = { title: 'Examples of AR use' };

  render() {
    return (
      <ScrollView style={styles.container}>
        {Object.keys(ARScreens)
          .filter(n => n !== 'AR')
          .map(screenName => (
            <View key={screenName} style={{ padding: 10 }}>
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
});
