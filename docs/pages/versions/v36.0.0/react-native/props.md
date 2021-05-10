---
id: props
title: Props
---

Most components can be customized when they are created, with different parameters. These created parameters are called `props`, short for properties.

For example, one basic React Native component is the `Image`. When you create an image, you can use a prop named `source` to control what image it shows.

```javascript
import React, { Component } from 'react';
import { Image } from 'react-native';

export default class Bananas extends Component {
  render() {
    let pic = {
      uri: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Bananavarieties.jpg',
    };
    return <Image source={pic} style={{ width: 193, height: 110 }} />;
  }
}
```

Notice the braces surrounding `{pic}` - these embed the variable `pic` into JSX. You can put any JavaScript expression inside braces in JSX.

Your own components can also use `props`. This lets you make a single component that is used in many different places in your app, with slightly different properties in each place by referring to `this.props` in your `render` function. Here's an example:

```javascript
import React, { Component } from 'react';
import { Text, View } from 'react-native';

class Greeting extends Component {
  render() {
    return (
      <View style={{ alignItems: 'center' }}>
        <Text>Hello {this.props.name}!</Text>
      </View>
    );
  }
}

export default class LotsOfGreetings extends Component {
  render() {
    return (
      <View style={{ alignItems: 'center', top: 50 }}>
        <Greeting name="Rexxar" />
        <Greeting name="Jaina" />
        <Greeting name="Valeera" />
      </View>
    );
  }
}
```

Using `name` as a prop lets us customize the `Greeting` component, so we can reuse that component for each of our greetings. This example also uses the `Greeting` component in JSX, similar to the built-in components. The power to do this is what makes React so cool - if you find yourself wishing that you had a different set of UI primitives to work with, you can invent new ones.

The other new thing going on here is the [`View`](view.md) component. A [`View`](view.md) is useful as a container for other components, to help control style and layout.

With `props` and the basic [`Text`](text.md), [`Image`](image.md), and [`View`](view.md) components, you can build a wide variety of static screens. To learn how to make your app change over time, you need to [learn about State](state.md).
