---
title: Clearing bundler caches on Windows
---

> Need to clear development caches on macOS or Linux? [Find the relevant commands here.](clear-cache-macos-linux.md)

There are a number of different caches associated with your project that can prevent your project from running as intended. Clearing a cache sometimes can help you work around issues related to stale or corrupt data and is often useful when troubleshooting and debugging.

### Expo CLI and Yarn
   ```
   del node_modules &:: With Yarn workspaces, you may need to
                    &:: delete node_modules in each workspace
   yarn cache clean
   yarn
   watchman watch-del-all
   del %appdata%\Temp\haste-map-*
   del %appdata%\Temp\metro-cache
   expo start --clear
   ```
### Expo CLI and npm
   ```
   del node_modules
   npm cache clean --force
   npm install
   watchman watch-del-all
   del %appdata%\Temp\haste-map-*
   del %appdata%\Temp\metro-cache
   expo start --clear
   ```
### React Native CLI and Yarn
   ```
   del node_modules &:: With Yarn workspaces, you may need to
                    &:: delete node_modules in each workspace
   yarn cache clean
   yarn
   watchman watch-del-all
   del %appdata%\Temp\haste-map-*
   del %appdata%\Temp\metro-cache
   yarn start -- --reset-cache
   ```
### React Native CLI and npm
   ```
   del node_modules
   npm cache clean --force
   npm install
   watchman watch-del-all
   del %appdata%\Temp\haste-map-*
   del %appdata%\Temp\metro-cache
   yarn start -- --reset-cache
   ```

## What these commands are doing

If you would like to understand what all that command is doing:

| Command                 | Description |
| ----------------------- | ----------- |
|`del node_modules`           | Clear all of the dependencies of your project |
|`yarn cache clean`           | Clear the global Yarn cache |
|`npm cache clean --force`    | Clear the global npm cache |
|`yarn`/`npm install`         | Reinstall all dependencies |
|`watchman watch-del-all`     | Reset the `watchman` file watcher |
|`del %appdata%\Temp/<cache>` | Clear the given packager/bundler cache file or directory |
|`expo start --clear`         | Restart the development server and instruct the bundlers (e.g., Webpack, Metro) to clear their caches |
