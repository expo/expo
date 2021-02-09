# jest-expo-enzyme

A [Jest](https://facebook.github.io/jest/) preset that enables you to test your universal Expo & React elements with the [**Enzyme**](https://airbnb.io/enzyme/) testing library.

The default preset extends `jest-expo` which means it will run **iOS, Android, and web** platforms with the recommended Enzyme configs for web and native. Notice that we omit the `node` runner because SSR environments don't need to test how virtual DOM is rendered.

## Installation

- `yarn add jest-expo-enzyme --dev` or `npm i jest-expo-enzyme --save-dev`
- Add the following config to `package.json`:

  ```js
  "scripts": {
    "test": "jest",
  },
  "jest": {
    "preset": "jest-expo-enzyme"
  }
  ```

- Create a `__tests__` directory anywhere you like and a `Example-test.js` file inside of it, and add this code:

  ```js
  it('works', () => {
    expect(1).toBe(1);
  });
  ```

- Run `yarn test` or `npm test` and it should pass

## Enzyme Example

The main benefit of using this preset is to get universal Enzyme support for testing your virtual DOM. Here is a basic example of testing how the `backgroundColor` property of a View style is rendered across iOS, Android, and web.

```js
import { shallow } from 'enzyme';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

it(`renders a view with a custom background`, () => {
  const component = shallow(<View style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />);
  // To debug your component use this:
  console.log('Component:', component.debug({ verbose: true }));

  // When snapshot testing, you should always try and be as concise as possible
  // here we are extracting the style prop from `View` on native and `div` on web
  const prop = component.find(Platform.select({ default: 'View', web: 'div' })).prop('style');

  // Flatten the style so we can read it as an object
  const style = StyleSheet.flatten(prop);

  /**
   * Android: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.5)"`;
   * iOS: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.5)"`;
   * web: exports[`renders a view with a custom background 1`] = `"rgba(0,0,0,0.50)"`;
   */
  expect(style.backgroundColor).toMatchSnapshot();
});
```

## Customization

When constructing your tests you will more than likely want to build them one platform at a time. To do this you'll want to create a `jest.config.js` with multiple platforms.

This is done by specifying a separate Jest config in the `projects` field of your custom Jest config. The `withEnzyme` method's purpose is to let you augment each single-platform Jest config with the configuration fields needed to support Enzyme.

This is why method `withEnzyme` exists.

You can use `withEnzyme` to add Enzyme support to an existing Jest config (**important:** this is only officially supported with Jest configs provided by `jest-expo`; mixing with other configs may not work as expected). Also use a custom serializer for the React Native **StyleSheet** API, which will make snapshot tests cleaner and easier to read.

### Usage

1. Create a `jest.config.js` in your root directory and delete the `jest` field in your `package.json`. You can also create any `js` file and pass it to the Jest CLI with the `-c` flag, ex: `yarn jest -c custom.config.js`.
2. Import the platforms you want to test and add Enzyme support:

```js
const { withEnzyme } = require('jest-expo-enzyme');

module.exports = {
  projects: [
    // Skipping Node because we want to test DOM presets only
    withEnzyme(require('jest-expo/ios/jest-preset')),
    withEnzyme(require('jest-expo/android/jest-preset')),
    // The Enzyme support added to web is different from that added to native, which `withEnzyme` handles
    // Luckily you won't have to do anything special because it reads the platform from
    // `haste.defaultPlatform` of the provided Jest config
    withEnzyme(require('jest-expo/web/jest-preset')),
  ],
};
```

3. Run your tests with this new preset!

### Snapshots

`jest-expo-enzyme` wraps `jest-expo` which means you get access to the advanced multi-platform snapshot system required for truly testing your universal application code.

Here is an example output:

|- `View-test.tsx`
|-- `__snapshots__/View-test.tsx.snap.android`
|-- `__snapshots__/View-test.tsx.snap.ios`
|-- `__snapshots__/View-test.tsx.snap.node`
|-- `__snapshots__/View-test.tsx.snap.web`

### Extensions

To test specific platforms you can use the following extensions:

- iOS: `-test.ios.*`, `-test.native.*`
- Android: `-test.android.*`, `-test.native.*`
- web: `-test.web.*`
- Node: `-test.node.*`, `-test.web.*`
