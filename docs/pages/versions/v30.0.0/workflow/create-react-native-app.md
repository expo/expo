---
title: Expo & "Create React Native App"
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

### WARNING

[Create React Native
App](https://facebook.github.io/react-native/blog/2017/03/13/introducing-create-react-native-app.html) has been replaced Expo-CLI. If you’ve already created your project with CRNA, you can read about migrating from CRNA to expo-CLI [here](https://github.com/react-community/create-react-native-app/blob/master/CHANGELOG.md#upgrading-from-1140-to-201).

### Important Notes

- Expo CLI is a tool based on CRNA, made by the same team.
- It has all the same features, plus some additional benefits.
- Like CRNA, Expo CLI does not require an Expo user account.
- The create-react-native-app command will continue to work.

### Why has Expo-CLI replaced CRNA?

- Just one tool to learn: previously developers would start with CRNA and then switch to exp or XDE for additional          features like standalone builds. Expo CLI is as easy to get started with as CRNA, but also supports everything            previously offered by these separate tools.
- Less confusing options: CRNA apps have always been loaded using the Expo app and able to use the Expo APIs in addition    to the core React Native APIs. Users are sometimes confused about the differences between plain React Native, CRNA and    Expo apps created with tools like exp or XDE. Installing the expo-cli package will make it clearer the additional         functionality is provided by Expo.
- Developer experience: Expo CLI is ahead of CRNA in terms of features and developer experience, and we’re continuously     improving it.
- Maintenance: having these two projects as separate codebases requires more maintenance and CRNA has previously fell       behind because of this. A single codebase helps us keep it up-to-date and fix issues as fast as possible.
