---
title: Unit testing with Jest
sidebar_title: Unit testing
description: Learn how to set up and configure the jest-expo library to write unit and snapshot tests for a project with Jest.
---

import { BookOpen02Icon } from '@expo/styleguide-icons/outline/BookOpen02Icon';
import { Cube01Icon } from '@expo/styleguide-icons/outline/Cube01Icon';

import { BoxLink } from '~/ui/components/BoxLink';
import { Collapsible } from '~/ui/components/Collapsible';
import { FileTree } from '~/ui/components/FileTree';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { Tabs, Tab } from '~/ui/components/Tabs';
import { CODE } from '~/ui/components/Text';

[Jest](https://jestjs.io) is the most widely used unit and snapshot JavaScript testing framework. In this guide, you will learn how to set up Jest in your project, write a unit test, write a snapshot test, and best practices for structuring your tests when using Jest with React Native.

You will also use the [`jest-expo`](https://github.com/expo/expo/tree/main/packages/jest-expo) library, which is a Jest preset that mocks the native part of the Expo SDK and handles most of the configuration required for your Expo project.

## Installation and configuration

If you have created your project using the [default Expo template](/get-started/create-a-project/), you can skip this section. The `jest-expo` and other required dev dependencies are already installed and configured.

<Collapsible summary={<>Manual installation instructions for <CODE>jest-expo</CODE></>}>

If you have created your project using [different template](/more/create-expo/#--template), follow the instructions below to install and configure `jest-expo` in your project.

<Step label="1">

Install `jest-expo` and other required dev dependencies in your project. Run the following command from your project's root directory:

<Terminal
  cmd={[
    '# For all other package managers',
    '$ npx expo install -- --save-dev jest-expo jest @types/jest',
    '',
    '# For yarn',
    '$ yarn add -D jest-expo jest @types/jest',
  ]}
/>

> **Note:** If your project is not using TypeScript, you can skip installing `@types/jest`.

</Step>

<Step label="2">

Open **package.json**, add a script for running tests, and add the preset for using the base configuration from `jest-expo`:

```json package.json
{
  "scripts": {
    "test": "jest --watchAll" /* @end */
    /* @hide ... */
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

</Step>

</Collapsible>

<Collapsible summary={<>Additional configuration for using <CODE>transformIgnorePatterns</CODE></>}>

You can transpile node modules your project uses by configuring [`transformIgnorePatterns`](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring) in your **package.json**. This property takes a regex pattern as its value:

<Tabs>

<Tab label="npm/Yarn">

```json package.json
"jest": {
  "preset": "jest-expo",
  /* @info */
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
  ]
  /* @end */
}
```

</Tab>

<Tab label="pnpm">

```json package.json
"jest": {
  "preset": "jest-expo",
  /* @info */
  "transformIgnorePatterns": [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))"
  ]
  /* @end */
}
```

</Tab>

</Tabs>

Jest has many configuration options, but the above configuration should cover most of your needs. However, you can always add to this pattern list. For more details, see [Configuring Jest](https://jestjs.io/docs/configuration).

</Collapsible>

## Install React Native Testing Library

The [React Native Testing Library (`@testing-library/react-native`)](https://callstack.github.io/react-native-testing-library/) is a lightweight solution for testing React Native components. It provides utility functions and works with Jest.

To install it, run the following command:

<Terminal
  cmd={[
    '# For all other package managers',
    '$ npx expo install -- --save-dev @testing-library/react-native',
    '',
    '# For yarn',
    '$ yarn add -D @testing-library/react-native',
  ]}
/>

> **warning** **Deprecated:** If you are using the default Expo template, after installing this library, you can uninstall the `react-test-renderer` and `@types/react-test-renderer` from your project's dev dependencies. The `react-test-renderer` has been deprecated and will no longer be maintained in the future. See [React's documentation for more information](https://react.dev/warnings/react-test-renderer).

## Unit test

A unit test checks the smallest unit of code, usually a function. To write your first unit test, take a look at the following example:

<Step label="1">

Inside the **app** directory of your project, create a new file called **index.tsx**, and the following code to render a simple component:

```tsx index.tsx
import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/* @info This is a custom component that will be used in the test. */
export const CustomText = ({ children }: PropsWithChildren) => <Text>{children}</Text>;
/* @end */

/* @info This component currently renders a welcome message on the app screen using the <CODE>CustomText</CODE> component. */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <CustomText>Welcome!</CustomText>
    </View>
  );
}
/* @end */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

</Step>

<Step label="2">

Create a **\_\_tests\_\_** directory at the root of your project's directory. If this directory already exists in your project, use that. Then, create a new file called **HomeScreen-test.tsx**. The `jest-expo` preset customizes the Jest configuration to also identify files with **-test.ts|tsx** extensions as tests.

Add the following example code in **HomeScreen-test.tsx**:

```tsx HomeScreen-test.tsx
import { render } from '@testing-library/react-native';

import HomeScreen, { CustomText } from '@/app/index';

describe('<HomeScreen />', () => {
  test('Text renders correctly on HomeScreen', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('Welcome!');
  });
});
```

In the above example, the `getByText` query helps your tests find relevant element in your app's user interface and make assertion whether or not the certain element exists. The React Native Testing Library provides this query, and each [query variant](https://callstack.github.io/react-native-testing-library/docs/api/queries#query-variant) differs in its return type. For more examples and detailed API information, see the React Native Testing Library's [Queries API reference](https://callstack.github.io/react-native-testing-library/docs/api/queries).

</Step>

<Step label="3">

Run the following command in a terminal window to execute the test:

<Terminal cmd={['$ npm run test']} />

You will see one test being passed.

</Step>

## Structure your tests

Organizing your test files is important to make them easier to maintain. A common pattern is creating a **\_\_tests\_\_** directory and putting all your tests inside.

An example structure of tests next to the **components** directory is shown below:

<FileTree
  files={[
    '__tests__/ThemedText-test.tsx',
    'components/ThemedText.tsx',
    'components/ThemedView.tsx',
  ]}
/>

Alternatively, you can have multiple **\_\_tests\_\_** sub-directories for different areas of your project. For example, create a separate test directory for **components**, and so on:

<FileTree
  files={[
    'components/ThemedText.tsx',
    'components/__tests__/ThemedText-test.tsx',
    'utils/index.tsx',
    'utils/__tests__/index-test.tsx',
  ]}
/>

It's all about preferences, and it is up to you to decide how you want to organize your project directory.

## Snapshot test

A [snapshot test](https://jestjs.io/docs/en/snapshot-testing) is used to make sure that UI stays consistent, especially when a project is working with global styles that are potentially shared across components.

To add a snapshot test for `<HomeScreen />`, add the following code snippet in the `describe()` in **HomeScreen-test.tsx**:

```tsx HomeScreen-test.tsx
describe('<HomeScreen />', () => {
  /* @hide ... */ /* @end */

  test('CustomText renders correctly', () => {
    const tree = render(<CustomText>Some text</CustomText>).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
```

Run `npm run test` command, and you will see a snapshot created inside **\_\_tests\_\_\\\_\_snapshots\_\_** directory, and two tests passed.

## Code coverage reports

Code coverage reports can help you understand how much of your code is tested. To see the code coverage report in your project using the HTML format, in **package.json**, under `jest`, set the `collectCoverage` to true and use `collectCoverageFrom` to specify a list of files to ignore when collecting the coverage.

```json package.json
"jest": {
  ...
  "collectCoverage": true,
  "collectCoverageFrom": [
    "**/*.{ts,tsx,js,jsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/expo-env.d.ts",
    "!**/.expo/**"
  ]
}
```

Run `npm run test`. You will see a **coverage** directory created in your project. Find the **lcov-report/index.html** and open it in a browser to see the coverage report.

> Usually, we don't recommend uploading **index.html** file to git. Add `coverage/**/*` in the **.gitignore** file to prevent it from being tracked.

## Jest flows (optional)

You can also use different flows to run your tests. Below are a few example scripts that you can try:

```json package.json
"scripts": {
  /* @info Active development of tests, watch files for changes, and re-runs all tests.*/
  "test": "jest --watch --coverage=false --changedSince=origin/main",
   /* @end */
  /* @info Debug, console.logs and only re-runs the changed file.*/
  "testDebug": "jest -o --watch --coverage=false",
   /* @end */
  /* @info Displays code coverage in CLI and updates the code coverage HTML.*/
  "testFinal": "jest",
  /* @end */
  /* @info When a screen or a component is updated, the test snapshots will throw a warning. This script updates them.*/
  "updateSnapshots": "jest -u --coverage=false"
   /* @end */
  /* @hide ... */ /* @end */
}
```

For more information, see [CLI Options](https://jestjs.io/docs/en/cli) in Jest documentation.

## Additional information

<BoxLink
  title="React Native Testing library documentation"
  description="See React Native Testing Library documentation, which provides testing utilities and encourages good testing practices and work with Jest."
  href="https://callstack.github.io/react-native-testing-library/docs/start/quick-start"
  Icon={BookOpen02Icon}
/>

<BoxLink
  title="Testing configuration for Expo Router"
  description="Learn how to create integration tests for your app when using Expo Router."
  href="/router/reference/testing/"
  Icon={BookOpen02Icon}
/>

<BoxLink
  title="E2E tests with EAS Build and Maestro"
  description="Learn how to set up and run E2E tests on EAS Build with Maestro."
  href="/build-reference/e2e-tests/"
  Icon={Cube01Icon}
/>
