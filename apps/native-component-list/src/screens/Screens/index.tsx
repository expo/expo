import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Container from './container';
import NativeStack from './nativeStack';
import Navigation from './navigation';

const SCREENS: Record<string, { component: any; options: { title: string } }> = {
  Container: { component: Container, options: { title: 'ScreenContainer example' } },
  NativeStack: { component: NativeStack, options: { title: 'ScreenStack example' } },
  Navigation: { component: Navigation, options: { title: 'React Navigation example' } },
};

type Links = { Container: undefined; NativeStack: undefined; Navigation: undefined };

type Props = { navigation: StackNavigationProp<Links> };

class MainScreen extends React.Component<Props> {
  static navigationOptions = {
    title: '📱 React Native Screens Examples',
  };
  render() {
    const data = Object.keys(SCREENS);
    return (
      <FlatList
        style={styles.list}
        data={data}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={(item) => item}
        renderItem={(props) => (
          <MainScreenItem
            item={props.item}
            // @ts-ignore
            onPressItem={(key) => this.props.navigation.navigate(key)}
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
          <Text style={styles.buttonText}>{SCREENS[item].options.title ?? item}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}

const Stack = createStackNavigator();
const SwitchStack = createStackNavigator();

const ExampleApp = () => (
  <SwitchStack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
    <SwitchStack.Screen name="Main">
      {() => (
        <Stack.Navigator>
          {/* @ts-ignore */}
          <Stack.Screen name="MainScreen" component={MainScreen} />
        </Stack.Navigator>
      )}
    </SwitchStack.Screen>
    {Object.keys(SCREENS).map((key) => (
      <SwitchStack.Screen key={key} name={key} {...SCREENS[key]} />
    ))}
  </SwitchStack.Navigator>
);

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
