---
title: How to clear the cache in Expo and React Native on Windows
---

> Need to clear the cache on OSX or Linux? [Find the relevant commands here.](clear-cache-osx-linux.md)

There are a number of different caches associated with your project that can prevent your project from running as intended. For a one-line command to clear them all:

### Expo CLI and Yarn
   `del node_modules && yarn cache clean && yarn && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && expo start -c`
### Expo CLI and NPM
   `del node_modules && npm cache clean --force && npm install && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && expo start -c`
### React Native CLI and Yarn
   `del node_modules && yarn cache clean && yarn && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && yarn start -- --reset-cache`
### React Native CLI and NPM
   `del node_modules && npm cache clean --force && npm install && watchman watch-del-all && del %appdata%\Temp\react-native-* && rm -rf del %appdata%\Temp\metro-bundler-cache-* && yarn start -- --reset-cache`

## What these commands are doing

If you would like to understand what all that command is doing:

| Command                 | Description |
| ----------------------- | ----------- |
|`del node_modules`    | Clear all of the dependencies of your project  |
|`yarn cache clean`       | Clear your package managers cache  |
|`yarn`                   | Reinstall all dependencies |
|`watchman watch-del-all` | Delete node_modules |
|`del %appdata%\Temp\foo`     | Clear your package managers cache |
|`expo start -c`          | Restart development server, clearing cache for good measure 