---
title: Appearance
---

Detect preferred color scheme (light, dark, or no preference) on iOS 13+.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-appearance`. In bare apps, make sure you also follow the [react-native-appearance linking and configuration instructions](https://github.com/expo/react-native-appearance#linking).

## API

To import this library, use:

```js
import { Appearance, AppearanceProvider, useColorScheme } from 'react-native-appearance';
````
First, you need to add (under the iOS key) `"userInterfacestyle": "automatic"`.

Next you need to wrap your app root component with an `AppearanceProvider`.

```js
import { AppearanceProvider } from 'react-native-appearance';

export default () => (
  <AppearanceProvider>
    <App />
  </AppearanceProvider>
);
```

Get the current color scheme imperatively with `Appearance.getColorScheme()` and listen to changes with `Appearance.addChangeListener`

```js
let colorScheme = Appearance.getColorScheme();

let subscription = Appearance.addChangeListener(({ colorScheme }) => {
  // do something with color scheme
});

// when you're done
subscription.remove();
```

If you're using hooks, this is made even easier with the `useColorScheme()` hook:

```js
function MyComponent() {
  let colorScheme = useColorScheme();

  if (colorScheme === 'dark') {
    // render some dark thing
  } else {
    // render some light thing
  }
}
```
-----
Full example:
```js
import react, {Component} from 'react';
import {Text, View} from 'react-native';

//import the modules
import {Appearance, AppearanceProvider} from 'react-native-appearance';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: Appearance.getColorScheme() // get initial color cheme
    }
    this.subscription = Appearance.addChangeListener(({ colorScheme }) => { //Add subscription to when the user changes themes
    //set the theme in state so that the app re-renders for the theme
      this.setState({theme: colorScheme})
    })
  }
  render() {
    return (
      <AppearanceProvider>
        <View stle={{
        flex:1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: this.state.theme == "light" ? "white" : "black"
        }}>
          <Text style={{color: this.state.theme == "dark" ? "white" : "black"}}>{this.state.theme}{"\n"}Change the system theme!</Text>

        </View>
      </AppearanceProvider>
    )
  }
}
```
