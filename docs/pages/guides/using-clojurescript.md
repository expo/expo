---
title: Using ClojureScript
old_permalink: /versions/v12.0.0/guides/using-clojurescript.html
previous___FILE: ./upgrading-expo.md
next___FILE: ./using-firebase.md
---

> **Note:** ClojureScript is not officially supported by the Expo team, this guide was written by [@tiensonqin](https://github.com/tiensonqin)!

## Quickstart

If you're already convinced about ClojureScript and Expo and know what to do once you have figwheel running, you can just read this section. Otherwise, we encourage you to read the entire guide.

```sh
lein new expo your-project

cd your-project && yarn install

lein figwheel

# Now in a new tab, open the project in a simulator
expo start --ios
```

## Why ClojureScript?

- First-class immutable data structures
- Minimizing state and side-effects
- Practicality and pragmatism are always core values of ClojureScript
- Lisp!
- Great JavaScript interoperability

## Why on Expo?

It all begins with a [Simple Made Easy](https://www.infoq.com/presentations/Simple-Made-Easy) design choice: **you don't write native code**.

- You only write ClojureScript or JavaScript.
- You don't have to install or use Xcode or Android Studio or deal with any of the platform specific configuration and project files.
- Much easier to upgrade when there is no native code involved -- React Native JavaScript APIs are relatively stable compared to the native side. Expo will take care of upgrading the native modules and React Native versions, you only need to upgrade your ClojureScript or JavaScript code.
- You can write iOS apps on Linux or Windows (provided that you have an iPhone to test it with).
- It's dead simple to continually share your apps. Once you published your app, you got a link. It is up to you to share the link.

## 1. Create an Expo project

```sh
# Default to use Reagent / Re-frame
lein new expo your-project

# Or Om Next
lein new expo your-project +om

cd your-project && yarn install
```

## 2. Connect to a REPL

### CLI REPL

```sh
lein figwheel
```

### Emacs REPL

1.  Invoke cider-jack-in.
2.  Run `(start-figwheel)` in the connected REPL.

### Cursive REPL

Learn more about [Cursive](https://cursive-ide.com/).

The first time you connect to the repl, you'll need to create a Leiningen nREPL Configuration unless you have one already.

1.  Click `Run->Edit` configurations.
2.  Click the `+` button at the top left and choose Clojure REPL.
3.  Choose a `Local REPL`.
4.  Enter a name in the Name field (e.g. "REPL").
5.  Choose the radio button `Use nREPL with Leiningen`.
6.  Click the `OK` button to save your REPL config.

Once this is done, you can connect to the REPL.

In IntelliJ make sure your REPL config is selected and click the green **play** button to start your REPL.

Run `(start-figwheel)` in the connected REPL.

## 3. Start Expo server

### Using Expo CLI

```sh
# Install Expo CLI if you have not already
npm install -g expo-cli

# Connect to iOS simulator
expo start --ios

# Or connect to Android devices or simulators
expo start --android
```

For more information, see [Expo CLI](../workflow/expo-cli.md).

## 4. Publish your app

```sh
# Generate main.js
lein prod-build

eas update
```

This will publish your app to a persistent URL on Expo, for example: `https://expo.dev/@community/startr`

## FAQ

### How do I add custom native modules?

See [How do I add custom native code to my Expo project?](../introduction/faq.md#faq).

### Does it support Google Closure advanced compilation?

It's still experimental, but it already works for multiple projects.

### Does it support source maps?

Yes.

### Can I use npm modules?

React Native uses JavaScriptCore, so modules using built-in node like stream, fs, etc wont work. Otherwise, you can just require like: `(js/require "SomeModule")`.

### Do I need to restart the REPL after adding new JavaScript modules or assets?

No, you do need to reload JavaScript. To do that, select **Reload** from the Developer Menu. You can also press <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in the iOS Simulator, or press <kbd>R</kbd> twice on Android emulators.

### Will it support Boot?

Not currently, but we are working on it.
