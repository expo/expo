Thanks for helping! 😄

## Setup

To get started clone the Expo monorepo:

```sh
git clone git@github.com:expo/expo.git
```

and follow the setup guide: [here](https://github.com/expo/expo#set-up)

## Usage

Navigate to the project `cd apps/storybook` then run `yarn start` to open the project.

Before submitting a PR ensure the tests are updated with `yarn test:web -u` while the server is running on port `6006` (`yarn start` will do this by default if no other instances are running.)

## Knobs

For an example of how knobs work, check out the Linear Gradient example.

## Native

The iOS and Android portions of this app aren't supported yet.


## Spec

Below is an outline for how to configure a screen in **Expo Storybook**. There is a fair amount of magic happening in `.storybook/config.js` so the individual screen component exports a few important properties for controlling how it interacts with the system.

```jsx
// The component that will be rendered inside the page
export const component = () => <View />;
// Optional: NPM Package for the related library
export const packageJson = require('expo/package.json');
// The title element and the name of the tab in the side-bar. Defaults to the packageJson name
export const title = 'App Loading';
// Description that will be rendered under the title element on the page. Defaults to the packageJson description
export const description = `
  A React component that tells Expo
  to keep the app loading screen open
  if it is the first and only component
  rendered in your app`;
// Github Label for querying related issues on Github
export const label = 'AppLoading';
// Side-bar grouping for the page
export const kind = 'AppLoading';
// A callback that is invoked with the stories object which you can use to apply.
export const onStoryCreated = ({ stories }) => {};
```
