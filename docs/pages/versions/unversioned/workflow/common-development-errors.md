---
title: Common Development Errors
---

Here you will find a list of errors that are commonly encountered by developers using Expo. For each error, the first bullet provides an explanation for why the error occurs and the second bullet contains debugging suggestions. If there is an error you think belongs here, we welcome and encourage you to [create a PR!](https://github.com/expo/expo/pulls)

### expo command not found

- Either you do not have `expo-cli` installed or it is not properly configured in your `$PATH`.

- [Install expo-cli](../../introduction/installation/) if you have not already. Otherwise, check how to set your `$PATH` based on your OS.

### Metro bundler ECONNREFUSED 127.0.0.1:19001

- An error is preventing the connection to your local development server.

- Run `rm -rf .expo` to clear your local state. Check for firewalls or [proxies](../../guides/troubleshooting-proxies/) affecting the network you are currently connected to.

### Module AppRegistry is not a registered callable module (calling runApplication)

- An error in your code is preventing the JavaScript bundle from being executed on startup.

- Try running `expo start --no-dev --minify` to reproduce the production JS bundle locally. If possible, connect your device and access the device logs via Android Studio or Xcode. Device logs contain much more detailed stacktraces and information. Check to see if you have any changes or errors in your Babel configuration.

### npm ERR! No git binary found in $PATH

- Either you do not have git installed or it is not properly configured in your `$PATH`.

- [Install git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) if you have not already. Otherwise, check how to set it in your `$PATH` based on your OS.

### XX.X.X is not a valid SDK version

- The SDK version you are running has been deprecated and is no longer supported. 

- [Upgrade your project](../../workflow/upgrading-expo-sdk-walkthrough/) to a supported SDK version. If you are using a supported version and see this message, you'll need to update your Expo client app. If you experience this error in a standalone app, make sure you have published a JS bundle for the specific SDK version and release channel for the given binary via `expo publish`.