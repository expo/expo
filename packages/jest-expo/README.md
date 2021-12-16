# jest-expo

A [Jest](https://facebook.github.io/jest/) preset to painlessly test your Expo / React Native apps.

### Installation

- To install the compatible version of `jest-expo` and `jest` for your project, run: `expo install jest-expo jest`.
- Add the following config to `package.json`:

  ```json
  "scripts": {
    ...
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo"
  }
  ```

- Create a `__tests__` directory anywhere you like and a `Example-test.js` file inside of it, and add this code:

  ```js
  it('works', () => {
    expect(1).toBe(1);
  });
  ```

- Run `npm test` and it should pass

>  You can use a different version of `jest` than the one that is installed with `expo install`, but keep in mind that the SDK and `jest-expo` are built against that version.

## Platforms

You can use `jest-expo` to test any Expo supported platform. For legacy purposes `jest-expo` runs your tests in the standard React Native environment (iOS).
The recommended way to test your project is with `jest-expo/universal` which runs your tests with every Expo supported platform. Currently this includes iOS, Android, web, and Node (which is used for testing SSR compliance).

Pressing **X** will open a platform-selection dialog that you can use to test individual platforms. You can also create a custom Jest config and combine the individual platforms with `jest-expo/ios`, `jest-expo/android`, `jest-expo/web`, and `jest-expo/node`.

### Snapshots

Because a test is run with multiple different platforms, `jest-expo` saves snapshots using the name of the platform as the extension. This is very useful for testing something like view styles, which are computed differently across web and native.

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

### Mixing runners

If you don't want to use every runner you can always mix runners by using the `projects` field of your Jest config. This will only work with single-runner projects like `jest-expo/ios`, `jest-expo/android`, `jest-expo/web`, and `jest-expo/node`.

```diff
"jest": {
-  "preset": "jest-expo/universal"
// Skip web and Node tests
+ "projects": [
+    { "preset": "jest-expo/ios" },
+    { "preset": "jest-expo/android"}
+ ]
},
```

### Testing JSX Components

To test the output of your React components you can use the library **jest-expo-enzyme**, which extends `jest-expo` and adds universal [Enzyme](https://airbnb.io/enzyme/) support.

### ⚙️ Configuring your preset

When building a custom preset you may want to use some of features provided by this preset. You can access these features through the `jest-expo/config` directory.

#### `getWatchPlugins(jestConfig)`

When given an existing Jest config this will return the `watchPlugins` used in `jest-expo`. This reads the `projects` field to determine which watchPlugins to return for single-project and multi-project configs.

Currently this returns type-ahead plugins for all projects:

- `jest-watch-typeahead/filename`
- `jest-watch-typeahead/testname`

And a custom platform selection dialog for universal multi-projects:

- `jest-watch-select-projects`

#### `withWatchPlugins(jestConfig)`

Given a Jest config, this will ensure any existing `watchPlugins` are safely merged with `getWatchPlugins(jestConfig)`.

#### `getWebPreset()`

Alternative to `jest-expo/web`. This runs in a JSDOM environment for testing **Expo web**.

#### `getIOSPreset()`

Alternative to `jest-expo/ios`. Runs in a mock native environment.

#### `getAndroidPreset()`

Alternative to `jest-expo/android`. Also runs in a mock native environment.

#### `getNodePreset()`

Alternative to `jest-expo/node`. This runs in a Node environment for testing **SSR**.

### Learning Jest

[Read the Jest documentation](https://facebook.github.io/jest/)
