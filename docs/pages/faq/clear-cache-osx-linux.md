---
title: How to clear the cache in Expo and React Native on OSX or Linux
---

> Need to clear the cache on Windows? [Find the relevant commands here.](clear-cache-windows.md)

There are a number of different caches associated with your project that can prevent your project from running as intended. For a one-line command to clear them all:

### Expo CLI and Yarn
   `rm -rf node_modules && yarn cache clean && yarn && watchman watch-del-all && rm -rf $TMPDIR/react-native-packager-cache-* && rm -rf $TMPDIR/metro-bundler-cache-* && expo start -c`
### Expo CLI and NPM
   `rm -rf node_modules && npm cache clean --force && npm install && watchman watch-del-all && rm -rf $TMPDIR/react-native-packager-cache-* && rm -rf $TMPDIR/metro-bundler-cache-* && expo start -c`
### React Native CLI and Yarn
   `rm -rf node_modules && yarn cache clean && yarn && watchman watch-del-all && rm -rf $TMPDIR/react-native-packager-cache-* && rm -rf $TMPDIR/metro-bundler-cache-* && yarn start -- --reset-cache`
### React Native CLI and NPM
`rm -rf node_modules && npm cache clean --force && npm install && watchman watch-del-all && rm -rf $TMPDIR/react-native-packager-cache-* && rm -rf $TMPDIR/metro-bundler-cache-* && yarn start -- -reset-cache`

## What these commands are doing

If you would like to understand what all that command is doing:

| Command                 | Description |
| ----------------------- | ----------- |
|`rm -rf node_modules`    | Clear all of the dependencies of your project  |
|`yarn cache clean`       | Clear your package managers cache  |
|`yarn`                   | Reinstall all dependencies |
|`watchman watch-del-all` | Delete node_modules |
|`rm -rf $TMPDIR/foo`     | Clear your package managers cache |
|`expo start -c`          | Restart development server, clearing cache for good measure 