# Apps

This directory contains the apps we use for testing Expo. **Do not add new apps to this repository.** Each app increases our maintenance costs and complexity of different packages in `node_modules` that interact with each other in subtle ways. To keep this repository healthy and maintainable, we need to minimize the number of apps we have.

- #### [bare-expo](https://github.com/expo/expo/tree/main/apps/bare-expo)
  An Expo app that can load the Test Suite and Native Component List's JS.
- #### [Expo Go](https://github.com/expo/expo/tree/main/apps/expo-go)
  The UI for the Expo Go client.
- #### [Native Component List](https://github.com/expo/expo/tree/main/apps/native-component-list)
  A showcase of the components and APIs in the default Expo preset.
- #### [Sandbox](https://github.com/expo/expo/tree/main/apps/sandbox)
  A project excluded from Git where you can try out things locally.
- #### [Test Suite](https://github.com/expo/expo/tree/main/apps/test-suite)
  End-to-end tests that run on Expo.

Ideally, we'd just have one directory with a customized project with Xcode and Android Studio projects. The project would have different build targets and include different native modules. We'd have a build target each for the Expo Client, Test Suite (customized, with support for APIs like payments), and Native Component List (customized). These would be the only apps in the repository.
