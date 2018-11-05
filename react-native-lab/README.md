# React Native Lab

React Native Lab is where we put our latest copy of React Native (as a Git submodule) and scripts and modules to help use it in our projects.

## React Native submodule

The `react-native` directory is a Git submodule whose origin is `expo/react-native`. We keep it on the `exp-latest` branch, which is updated to match the most recent `sdk-*` branch during each SDK update. Our `sdk-*` branches are based on upstream React Native releases.

### Making changes to React Native

When you make changes to React Native that you intend to land upstream, you should clone `expo/react-native`, make your change on a branch, and send a PR to `facebook/react-native`. After your PR has been merged and released in an upstream version of React Native, we'll get your change in one or two future SDK releases. Design your changes in ways that make sense to merge them upstream. If there is Expo-specific code in a change, split it into an upstream PR that makes React Native more configurable and keep the Expo-specific code in Expo.

#### Making changes to Expo's React Native fork

Occasionally we'll cherry-pick changes from `facebook/react-native#master` into `exp-latest` and our current `sdk-*` branch but we really prefer to stay close to the upstream React Native release on which our current `sdk-*` branch is based.

To apply commits in projects that use the unversioned (that is, latest) SDK, add them to `exp-latest`. We do this sparingly and mainly for important bug fixes. Add a card to the "Expo Patches" column in our [React Native Trello](https://trello.com/b/X5J3m1pA/react-native) and actively work towards removing that card by merging a PR upstream or making your change unnecessary. To release these changes to developers, add the commits to the current `sdk-*` branch of `expo/react-native` and talk to whomever's responsible for releasing new Expo `react-native` versions.

**We need our React Native fork to stay perpetually close to upstream.** One way to think of our fork is an upstream release plus a small number of commits that have been merged upstream (and prefer commits that are in a stable release branch) or are likely to be merged soon. We also need our React Native fork to be replaceable with an upstream release of React Native when people using the Expo CLI eject to bare React Native.

### Upgrading React Native

When we upgrade our version of React Native, we create a new branch called `sdk-*`, where `*` is the version of our next SDK. This branch is based on the latest stable release of React Native upstream. We cherry-pick in changes from `exp-latest` that are still relevant and have not already been merged into the stable release branch. **Commits that aren't in `exp-latest` won't be applied to the next `sdk-*` branch.**

The new `sdk-*` branch is used in a branch of Universe called `sdk-*-candidate`. After the client apps are in a nominal working state, we set `expo/react-native#exp-latest` to point to `expo/react-native#sdk-*` apply the `universe#sdk-*-candidate` branch's commits to `universe#master`.
