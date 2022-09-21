---
title: Delaying Your Code To Run Later
sidebar_title: Delaying Your Code
---

import { Tab, Tabs } from '~/components/plugins/Tabs'

import SnackInline from '~/components/plugins/SnackInline'

When building an application, much of your code will run in response to events like component lifecycle events and user interactions. Sometimes you'll need to delay when your code runs instead of running it immediately after an event. Responsive applications need to respond quickly to user interactions and render smooth animations, but the code for your user interface (such as React components that update the UI) shares a JS thread with other event-handling code. Therefore, you should be careful to schedule work in small increments and at times that won't impact your users' experience to deliver a great experience to your users.


## Delaying code while your app is in the foreground
 While your application is in the foreground, you have access to scheduling functions that are often available in other JS environments like `setTimeout`, `setInterval`, and `requestAnimationFrame`. If you are not familiar with these methods or when you might use them we recommend Mozilla's guide on [asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Timeouts_and_intervals).

### InteractionManager

React Native provides an additional timing technique with [InteractionManager](https://reactnative.dev/docs/interactionmanager). InteractionManager allows you to schedule computationally expensive code to run after any interactions and animations they might impact have completed. You can schedule computations to run with `InteractionManager.runAfterInteractions(() => { /* your task */ })`.

React Native itself, and high-quality libraries you might use, already register animations with `InteractionManager`. If you need to, you can:
- register any other animations via `InteractionManager.createInteractionHandle()` on the start of your animation 
- signal completion via `InteractionManager.clearInteractionHandle(resultOfCallToCreateInteractionHandle)`


### Usage in React Native

You may need to update a component's state at the end of your computation. A few points to note:
- Make sure that your timers do not live beyond the lifecycle of your component by clearing your timers in an effect hook's cleanup function or the `componentWillUnmount` lifecycle method.
- With class components, you must bind the context, either explicitly or by using arrow functions, to have access to methods like `setState` when your computation is run.
- `setState` is asynchronous, so if you need to [mutate the existing state](https://reactjs.org/docs/react-component.html#setstate), pass a function rather than an object to the method.


<Tabs>
<Tab label="With Hooks">
<SnackInline>

{/* prettier-ignore */}
```jsx
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

const App = () => {
  // Set the initial count to 0
  const [count, setCount] = useState(0);
  useEffect(() => {
    // increment the count by 1
    const countTimer = setInterval(() => {
      setCount((prevCount) => prevCount + 1);
    // every 1000 milliseconds
    }, 1000);
    // and clear this timer when the component is unmounted
    return function cleanup() {
      clearInterval(countTimer);
    };
  });

  return (<Text>Count is {count}</Text>);
};

export default App;
```
</SnackInline>
</Tab>
<Tab label="With Class Components">
<SnackInline>

{/* prettier-ignore */}
```jsx
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
    return <Text>Count is {this.state.count}</Text>;
  }
}
```
</SnackInline>
</Tab>
</Tabs>



## Delaying code while your app is in the background

For some use cases, you want your computation to continue even while your user switches to another app. Setting this up manually can be complex, so Expo provides some modules that simplify things for the most common use cases.


| If you want to... | You can use... |
| ----------------------- | ----------- |
| fetch data from some endpoint          | [expo-background-fetch](../versions/latest/sdk/background-fetch.md) |
| respond to changes in the user's location           | [expo-location](../versions/latest/sdk/location.md) |
| perform a generic long-running computation   | [expo-task-manager](../versions/latest/sdk/task-manager.md) |
