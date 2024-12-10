---
title: React Compiler
description: Learn how to enable and use the React Compiler in Expo apps.
---

import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';

> **warning** **Warning:** React Compiler is experimental. Currently, it is on hold and we'll soon provide more updates on its usage.

The new [React Compiler](https://react.dev/learn/react-compiler) automatically memoizes components and hooks to enable fine-grained reactivity. This can lead to significant performance improvements in your app. The React Compiler is currently experimental and is not enabled by default. You can enable it in your app by following the instructions below.

## Enabling React Compiler

<Step label="1">

[Check how compatible](https://react.dev/learn/react-compiler#checking-compatibility) your project is with the React Compiler.

<Terminal cmd={['$ npx react-compiler-healthcheck@latest']} />

This will generally verify if your app is following the [**rules of React**](https://react.dev/reference/rules).

</Step>

<Step label="2">

Install `babel-plugin-react-compiler` in your project:

<Terminal cmd={['$ npx expo install babel-plugin-react-compiler']} />

</Step>

<Step label="3">

Toggle on the React Compiler experiment in your app config file:

```json app.json
{
  "experiments": {
    "reactCompiler": true
  }
}
```

</Step>

<Step label="4">

Install the React compiler runtime module:

<Terminal cmd={['$ npx expo install react-compiler-runtime@beta']} />

</Step>

### Enabling the linter

> In the future, all of these steps below will be automated by Expo CLI.

Additionally, you should use the ESLint plugin to continuously enforce the rules of React in your project.

<Step label="1">

Run [`npx expo lint`](/guides/using-eslint/#eslint) to ensure ESLint is setup in your app, then install the ESLint plugin for React Compiler:

<Terminal cmd={['$ npx expo install eslint-plugin-react-compiler']} />

</Step>

<Step label="2">

Update your ESLint configuration to include the plugin:

```js .eslintrc.js
// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  plugins: ['eslint-plugin-react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
  },
};
```

</Step>

## Incremental adoption

You can incrementally adopt the React Compiler in your app using a few strategies:

<Step label="1">

Configure the Babel plugin to only run on specific files or components. To do this, add the following to your project's Babel configuration:

```js babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          'react-compiler': {
            sources: filename => {
              // Match file names to include in the React Compiler.
              return filename.includes('src/path/to/dir');
            },
          },
        },
      ],
    ],
  };
};
```

Whenever you change your **babel.config.js** file, you need to restart the Metro bundler to apply the changes:

<Terminal cmd={['$ npx expo start --clear']} />

</Step>

<Step label="2">

Use the `"use no memo"` directive to opt out of the React Compiler for specific components or files.

```jsx
function MyComponent() {
  'use no memo';

  return <Text>Will not be optimized</Text>;
}
```

</Step>

## Usage

> To better understand how React Compiler works, check out the [React Playground](https://playground.react.dev/).

Improvements are primarily automatic. You can remove instances of `useCallback`, `useMemo`, and `React.memo` in favor of the automatic memoization. Class components will not be optimized. Instead, migrate to function components.

Expo's implementation of the React Compiler will only run on application code (no node modules), and only when bundling for the client (disabled in server rendering).

## Configuration

You can pass additional settings to the React Compiler Babel plugin by using the `react-compiler` object in the Babel configuration:

```js babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          'react-compiler': {
            // Passed directly to the React Compiler Babel plugin.
            compilationMode: 'strict',
            panicThreshold: 'all_errors',
          },
          web: {
            'react-compiler': {
              // Web-only settings...
            },
          },
        },
      ],
    ],
  };
};
```
