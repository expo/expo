---
title: Routing & Navigation
old_permalink: /versions/v12.0.0/guides/routing-and-navigation.html
previous___FILE: ./using-custom-fonts.md
next___FILE: ./push-notifications.md
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

A "single page app" on the web is not an app with a single screen, that would indeed be useless most of the time; rather, it is an app that does not ask the browser to navigate to a new URL for each new screen. Instead, a "single page app" will use its own routing subsystem (eg: react-router) that decouples the screens that are being displayed from the URL bar. Often it will also update the URL bar too, but override the mechanism that will cause the browser to reload the page entirely. The purpose of this is for the experience to be smooth and "app-like".

This same concept applies to native mobile apps. When you navigate to a new screen, rather than refreshing the entire app and starting fresh from that screen, the screen is pushed onto a navigation stack and animated into view according to its configuration.

The library that we recommend to use for routing & navigation in Expo is [React Navigation](https://github.com/react-community/react-navigation). You can see the [full documentation for React Nativation on the React Navigation website](https://www.reactnavigation.org/).

## Try it out

The best way to become familiar with what React Navigation is capable of is to try out the [React Navigation example Expo app](https://expo.io/@react-navigation/NavigationPlayground). Once you've had a chance to try that, come back here and read on!

## An introduction: the most bare-bones navigation configuration

You can follow along by copying all of the following code into `App.js` on a brand new blank Expo project, and running `npm install react-navigation --save`.

```javascript
import React from 'react';
import {
  Text,
  View,
} from 'react-native';

import {
  StackNavigator,
} from 'react-navigation';

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home'
  };

  render() {
    return (
      <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
        <Text onPress={this._handlePress}>HomeScreen!</Text>
      </View>
    )
  }

  _handlePress = () => {
    this.props.navigation.navigate('Home');
  }
}

export default StackNavigator({
  Home: {
    screen: HomeScreen,
  },
});
```

React Navigation is made up of "routers", "navigators", and "screens". In this example, we export a new `StackNavigator` as the default component for our app. A `StackNavigator` provides a way for our app to transition between screens where each new screen is placed on the top of the stack. `StackNavigator`'s provide your app with a platform-native look and feel; on iOS new screens slide in from the right, while also animating the navigation bar appropriately, and on Android new screens fade in from the bottom.

Navigator's take a `RouteConfig` as their first option, which is a map of route names to screens.

For the most part, a screen is a normal React componenent, with two special features:

1. We can define options for each screen by defining a `navigationOptions` static property on each screen component. In this static property, we can set various options, such as the title, a custom left header view, or whether or not navigation gestures are enabled when that screen is visible.
2. A special `navigation` prop is passed into the component. The `navigation` prop provides helper functions for reading the current navigation state as well as navigating to other screens in your app. In our sample app, in the `_handlePress` method, we call `this.props.navigation.navigate` to navigate to the `Home` route and push it onto our stack.

## Reviewing the tab template

You probably don't want to start all of your projects completely from scratch, and the tab template is one of many to come from Expo that will hopefully give you a headstart on building your app. It comes with `react-navigation` pre-installed, and tab-based navigation set up for you.

Let's look at the project structure of the tab template as it relates to navigation. This is not a pattern that you absolutely must follow, but we find it works quite well for us.

```javascript
├── App.js
├── navigation
│   ├── RootNavigation.js
│   └── MainTabNavigator.js
├── screens
│   ├── HomeScreen.js
│   ├── LinksScreen.js
│   └── SettingsScreen.js
```

### App.js

In Expo apps, this file contains the root component of your app. In the tab template, this is where we render our `RootNavigation` component.

### navigation/RootNavigation.js

This component is responsible for rendering our root navigation layout. Though we use a tab-based layout in this example, you might use a drawer layout here on Android, alternatively, or some other kind of layout. In the template, the `RootNavigation` that we render in `App.js` will only ever point to the `Main` screen, and each of the tabs in that screen renders their own `StackNavigator` component.

Another responsibility that we have given to this component is to subscribe to push notifications, so that when one is received or selected, we can respond by navigating to a new route.

### navigation/MainTabNavigator.js

In this file, we export a new `TabNavigator` with three routes, "Home", "Links", and "Settings". In addition, we configure various options on the TabNavigator, such as a function to define the default `tabBarIcon` navigation option, disable animation, set the tab bar to be at the bottom part of the screen, etc.

### screens/[\*](#id1)Screen.js

All of the components that represent screens in our app are organized into a `screens` directory (a screen is not strictly defined anywhere, it is up to you to decide what you think fits -- generally this is usually anything that would be `pushed` or `popped` from a stack).

## Learning more about routing & navigation

`react-navigation` is not the only React Native routing library, but it is our recommended approach and we might not be able to answer your questions about other libraries. You can learn more about it [on the Github repository](https://github.com/react-community/react-navigation) and at [reactnavigation.org](https://reactnavigation.org/).
