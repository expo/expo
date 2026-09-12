# React Native Lab

React Native Lab is where we put our latest copy of React Native (as a Git submodule) and scripts and modules to help use it in Expo Go.

## React Native submodule

The `react-native` directory is a Git submodule whose origin is `expo/react-native`. We keep it on the latest `sdk-*` branch, and our `sdk-*` branches are based on upstream React Native releases.

### Making changes to React Native

When you make changes to React Native that you intend to land upstream, you should clone `expo/react-native`, make your change on a branch, and send a PR to `facebook/react-native`. After your PR has been merged and released in an upstream version of React Native, we'll get your change in one or two future SDK releases. Design your changes in ways that make sense to merge them upstream. If there is Expo-specific code in a change, split it into an upstream PR that makes React Native more configurable and keep the Expo-specific code in Expo.

#### Making changes to Expo's React Native fork

Occasionally we'll cherry-pick changes from `facebook/react-native#master` into our current `sdk-*` branch but we really prefer to stay close to the upstream React Native release on which our current `sdk-*` branch is based.

To apply commits in projects that use the unversioned (that is, latest) SDK, add them to `sdk-*`. We do this sparingly and mainly for important bug fixes. Add a card to the "Expo Patches" column in our [React Native Trello](https://trello.com/b/X5J3m1pA/react-native) and actively work towards removing that card by merging a PR upstream or making your change unnecessary. To release these changes to developers, add the commits to the current `sdk-*` branch of `expo/react-native` and talk to whomever's responsible for releasing new Expo `react-native` versions.

**We need our React Native fork to stay perpetually close to upstream.** One way to think of our fork is an upstream release plus a small number of commits that have been merged upstream (and prefer commits that are in a stable release branch) or are likely to be merged soon. We also need our React Native fork to be replaceable with an upstream release of React Native when people using the Expo CLI eject to bare React Native.

### Upgrading React Native

When we upgrade React Native, create a new branch from the upstream release tag and cherry-pick the Expo commits from **the branch `expo/expo` `main` currently pins**, not from the prior `sdk-*` branch by name. Find it with `git ls-tree main react-native-lab/react-native` in `expo/expo`, then `git branch -r --contains <sha>` here.

Older `sdk-*` branches carry patches that `expo/expo` has since replaced with its own code. Replaying them breaks Expo Go: the old `DevServerHelper` patch, for example, calls an Expo Go method that no longer exists, so every dev server bundle URL comes back empty. Skip any commit whose change has landed upstream. Judge the branch by `git diff <upstream-tag>..<branch>`, which should touch only the files that still need a patch.

Point `expo/expo` at the new branch in the same PR as the React Native upgrade.
