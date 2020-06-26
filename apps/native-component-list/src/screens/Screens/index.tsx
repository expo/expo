// tslint:disable max-classes-per-file
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { createSwitchNavigator, NavigationScreenProps } from 'react-navigation';

import createStackNavigator from '../../navigation/createStackNavigator';
import Container from './container';
import NativeStack from './nativeStack';
import Navigation from './navigation';

const SCREENS: Record<string, { screen: any; title: string }> = {
  Container: { screen: Container, title: 'ScreenContainer example' },
  NativeStack: { screen: NativeStack, title: 'ScreenStack example' },
  Navigation: { screen: Navigation, title: 'React Navigation example' },
};

class MainScreen extends React.Component<NavigationScreenProps> {
  static navigationOptions = {
    title: '📱 React Native Screens Examples',
  };
  render() {
    const data = Object.keys(SCREENS);
    return (
      <FlatList<string>
        style={styles.list}
        data={data}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={item => item}
        renderItem={props => (
          <MainScreenItem
            item={props.item}
            onPressItem={key => this.props.navigation.navigate(key)}
          />
        )}
      />
    );
  }
}

const ItemSeparator = () => <View style={styles.separator} />;

class MainScreenItem extends React.Component<{
  item: string;
  onPressItem: (item: string) => void;
}> {
  _onPress = () => this.props.onPressItem(this.props.item);
  render() {
    const { item } = this.props;
    return (
      <TouchableHighlight onPress={this._onPress}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>{SCREENS[item].title || item}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const MainScreenNav = createStackNavigator({
  MainScreen: { screen: MainScreen },
});

const ExampleApp = createSwitchNavigator(
  {
    Main: { screen: MainScreenNav },
    ...SCREENS,
  },
  {
    initialRouteName: 'Main',
  }
);

ExampleApp.navigationOptions = {
  header: null,
};

const styles = StyleSheet.create({
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  buttonText: {
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default ExampleApp;
