import { Constants } from 'expo';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DrawerItems, SafeAreaView } from 'react-navigation';

import CheckList from './CheckList';

export default class DrawerContentComponent extends React.Component {
  render() {
    const { props } = this;
    return (
      <ScrollView>
        <SafeAreaView style={styles.container} forceInset={{ top: 'always', horizontal: 'never' }}>
          <DrawerItems {...props} />
          <CheckList />
        </SafeAreaView>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  image: {
    flex: 1,
    height: 300,
  },
});
