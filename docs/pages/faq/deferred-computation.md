---
title: Deferred Computation in Expo and React Native
---

import SnackInline from '~/components/plugins/SnackInline'

When building an application, you will often need to perform some computation after a period of time rather than in response to some event or component lifecycle event.  Because mobile applications rely heavily on interactions and your computation shares a JS thread with updates to the UI, performant apps must be careful to schedule work in small increments and at times that will not impact your users' experience.


## While your app is in the foreground
 While your application is in the foreground, you have access to all of the techniques available in JS development like setTimeout, setInterval, and requestAnimationFrame.  If you are not familiar with these methods or when you might use them we recommend Mozilla's guide on [asynchronous Javascript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Timeouts_and_intervals).

React Native provides an additional timing technique with InteractionManager.  InteractionManager allows you to schedule computationally expensive computations to run after any interactions and animations they might impact have completed.  You can schedule computations to run with `InteractionManager.runAfterInteractions(() => { /* your task */})` React Native itself, and high-quality libraries you might use, already register themselves with `InteractionManager`.  If you need to, you can register any other animations via `InteractionManager.createInteractionHandle()` on the start of your animation and signal completion via `InteractionManager.clearInteractionHandle(resultOfCallToCreateInteractionHandle)`


### Usage in React Native

In React Native You may need to update your application's state as a result of your computation.  A few points to note:
- Make sure that your timers do not live beyond the lifecycle of your component by clearing your timers created in componentWillUnmount.
- You must bind the context, either explicitly or by using arrow notation, to have access to methods like setState when your computation is run.
- setState is asynchronous, so if you need to mutate the existing state, pass a function rather than an object to the method.

<SnackInline>

<!-- prettier-ignore -->
```js
import React from 'react';
import { Text } from 'react-native';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
    };
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState((state) => ({ count: state.count + 1 }));
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    return <Text>{this.state.count}</Text>;
  }
}
```

</SnackInline>


## While your app is in the background

For some use cases, you want your computation to continue even while your user switches to another app.  Setting this up manually can be complex, so we provide some modules that simplify things for the most common use cases.


| If you want to... | You can use... |
| ----------------------- | ----------- |
| fetch data from some endpoint          | [expo-background-fetch](https://docs.expo.io/versions/latest/sdk/background-fetch/) |
| respond to changes in the user's location           | [expo-location](https://docs.expo.io/versions/latest/sdk/location/) |
| perform a generic long-running computation   | [expo-task-manager](https://docs.expo.io/versions/latest/sdk/task-manager/) |
