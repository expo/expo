---
id: navigation
title: Navigating Between Screens
---

Mobile apps are rarely made up of a single screen. Managing the presentation of, and transition between, multiple screens is typically handled by what is known as a navigator.

This guide covers the various navigation components available in React Native. If you are just getting started with navigation, you will probably want to use [React Navigation](../navigation/#react-navigation). React Navigation provides an easy to use navigation solution, with the ability to present common stack navigation and tabbed navigation patterns on both iOS and Android.

If you'd like to achieve a native look and feel on both iOS and Android, or you're integrating React Native into an app that already manages navigation natively, the following library provides native navigation on both platforms: [react-native-navigation](https://github.com/wix/react-native-navigation).

## React Navigation

The community solution to navigation is a standalone library that allows developers to set up the screens of an app with just a few lines of code.

The first step is to install in your project:

```javascript

npm install --save react-navigation

```

The second step is to install react-native-gesture-handler

```javascript

yarn add react-native-gesture-handler
# or with npm
# npm install --save react-native-gesture-handler

```

Now we need to link our react-native to react-native-gesture-handler

```javascript

react-native link react-native-gesture-handler

```

Then you can quickly create an app with a home screen and a profile screen:

```javascript
import { createStackNavigator, createAppContainer } from 'react-navigation';

const MainNavigator = createStackNavigator({
  Home: { screen: HomeScreen },
  Profile: { screen: ProfileScreen },
});

const App = createAppContainer(MainNavigator);

export default App;
```

Each screen component can set navigation options such as the header title. It can use action creators on the `navigation` prop to link to other screens:

```javascript
class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Welcome',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <Button title="Go to Jane's profile" onPress={() => navigate('Profile', { name: 'Jane' })} />
    );
  }
}
```

React Navigation routers make it easy to override navigation logic. Because routers can be nested inside each other, developers can override navigation logic for one area of the app without making widespread changes.

The views in React Navigation use native components and the [`Animated`](../animated/) library to deliver 60fps animations that are run on the native thread. Plus, the animations and gestures can be easily customized.

For a complete intro to React Navigation, follow the [React Navigation Getting Started Guide](https://reactnavigation.org/docs/getting-started.html), or browse other docs such as the [Intro to Navigators](https://expo.io/@react-navigation/NavigationPlayground).
