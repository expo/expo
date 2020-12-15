---
title: Errors and debugging
---

import Video from '~/components/plugins/Video'

> This is a brief introduction to debugging an Expo app. [We provide a more in-depth guide here](../workflow/debugging.md)

In development it won't be long before you encounter a "Redbox" error or "Yellowbox" warning.

Redbox errors will show when a fatal error has occurred that prevents your app from running. Warnings will show to let you know of a _possible_ issue that you should probably look into before shipping your app.

You can also create warnings and errors on your own with `console.warn("Warning message")` and `console.error("Error message")`. Another way to trigger the redbox is to throw an error and not catch it: `throw Error("Error message")`.

## Redbox errors and stack traces

When you encounter an error during development, you will be shown the error message, as well as the "stacktrace," which is a report of the recent calls your application made or was making when it crashed. This stacktrace is shown both in your terminal and in the Expo client app.

This stacktrace is **extremely valuable** since it gives you the location the error comes from. For example, in the following clip we know that the error came from the file `LinksScreen.js` on line 10 and column (character) 15.

<Video file="debugging/stacktrace.mp4" />

When we take a look at that file, in line 10, we can see we are calling the function `this.renderText()`. "`this`" refers to our `LinksScreen` component, and `renderText` _should_ be a method in our component, but we haven't declared it! Hence the error message telling us that `this.renderText is undefined` (we haven't told the app that `renderText` is a function it can call, yet). Once we add that declaration in, our app is working again!

This is a simple example, but it shows how useful error messages and stacktraces can be if you take the time to decipher them. Debugging errors is one of the most frustrating, but also satisyfing parts of development, and remember that you're never alone! The Expo community and the React and React Native communities are great resources for help when you get stuck. There's a good chance someone else has run into the exact same error as you, so make sure to read the documentation, search the [forums](https://forums.expo.io/), [Github issues](https://github.com/expo/expo/issues/), and [StackOverflow](https://stackoverflow.com/).

## Up Next

We suggest [following a tutorial](../tutorial/planning.md) before proceeding to the rest of the documentation, this will guide you through building a simple but meaningful project. [Continue to the tutorial](../tutorial/planning.md).
