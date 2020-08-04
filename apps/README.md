# Apps

This directory contains the apps we use for testing Expo. **Do not add new apps to this repository.** Each app increases our maintenance costs and complexity of different packages in `node_modules` that interact with each other in subtle ways. To keep this repository healthy and maintainable, we need to minimize the number of apps we have.

- Test Suite: end-to-end tests that run on Expo
- Native Component List: a showcase of the components and APIs in the default Expo preset
- Home (not in this directory): the UI for the development client
- Sandbox: a project excluded from Git where you can try out things locally
- jest-expo Mock Generator: an app that uses reflection to generate Jest mocks for native modules. Eventually we can remove the need for this once we have a JSON schema for each module definition (Turbomodules) and generate the Jest mock from the JSON schema.
- bare-expo: a project that uses the bare workflow and can load the Test Suite and Native Component List's JS.

Ideally, we'd just have one directory with a customized project with Xcode and Android Studio projects. The project would have different build targets and include different native modules. We'd have a build target each for the Expo Client, Test Suite (customized, with support for APIs like payments), and Native Component List (customized). These would be the only apps in the repository.
