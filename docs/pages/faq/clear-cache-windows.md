---
title: How to clear the cache in Expo and React Native on Windows
---

> Need to clear the cache on MacOS or Linux? [Find the relevant commands here.](clear-cache-macos-linux.md)

There are a number of different caches associated with your project on your development machine that can prevent it from running as expected. For a one-line command to clear them all:

### Expo CLI and Yarn
   `del node_modules && yarn cache clean && yarn && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && expo start -c`
### Expo CLI and NPM
   `del node_modules && npm cache clean --force && npm install && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && expo start -c`
### React Native CLI and Yarn
   `del node_modules && yarn cache clean && yarn && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && yarn start -- --reset-cache`
### React Native CLI and NPM
   `del node_modules && npm cache clean --force && npm install && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && yarn start -- --reset-cache`

## What these commands are doing

It is a good habit to understand what commands you find on the internet before you run them.  We break down each commmand below for Expo CLI and Yarn, but the corresponding commands for NPM and React Native CLI have the same function.

| Command                 | Function |
| ----------------------- | ----------- |
|`del node_modules`       | Clear all of the dependencies of your project  |
|`yarn cache clean`       | Clear your package managers cache  |
|`yarn`                   | Reinstall all dependencies |
|`watchman watch-del-all` | Clear watches and triggers from the watchman process |
|`del %appdata%\Temp\foo` | Clear the Metro bundler cache |
|`expo start -c`          | Restart development server, clearing the cache | 