# Expo JavaScript Style Guide

- [Modern JavaScript](#modern-javascript)
- [ESLint and Prettier](#eslint-and-prettier)
  - [Editor Integration](#editor-integration)
- [Formatting](#formatting)
  - [Prettier](#prettier)
  - [Comments](#comments)
  - [Imports](#imports)
- [Naming](#naming)
  - [Classes, functions, and variables](#classes--functions--and-variables)
  - [Async functions](#async-functions)
  - [Private variables](#private-variables)
  - [Boolean names](#boolean-names)
- [Examples](#examples)
- [Babel](#babel)

This guide explains style guidelines for writing JavaScript for Expo. It prioritizes readability for the team and also is meant to simplify small decisions when writing code. Most of this guide applies widely across the Expo repository but sometimes writing JavaScript differs between React, the web, and Node.

# Modern JavaScript

We generally use modern JavaScript on Expo, which means stable versions of the ES20xx specification with a few extensions, like JSX. We stay near the leading edge but away from the bleeding edge.

# ESLint and Prettier

ESLint reports errors and warnings for several style guidelines. Generally, the Expo ESLint configuration will report an error when it detects something that will prevent the code from working and a warning when it detects a style or formatting nit. The Expo configuration is written leniently and you should almost never have to use `/* eslint-disable */` comments. If you find yourself wanting to disable it, tell @ide so we can adjust the ESLint configuration to always be on.

ESLint also uses Prettier, a code formatter, to check code formatting and to reformat code automatically; with Expo’s configuration, running ESLint runs Prettier too.

ESLint has a `--fix` flag that tells it to fix errors and warnings when it can. Not all errors and warnings are automatically fixable but several are, including those reported by Prettier.

## Editor Integration

Many popular editors have ESLint plugins. Since the Expo ESLint configuration uses Prettier, if you configure your editor to use ESLint, it will use Prettier as well. These are some popular plugins:

- **VS Code:** https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
- **Atom and Nuclide:** https://atom.io/packages/linter-eslint
- **Sublime Text:** https://github.com/roadhump/SublimeLinter-eslint
- **Emacs:** Flycheck with javascript-eslint
  - Configure it to use the nearest available copy of ESLint by searching up `node_modules`: https://github.com/codesuki/add-node-modules-path
- **Vim:** Syntastic: https://github.com/vim-syntastic/syntastic/blob/master/syntax_checkers/javascript/eslint.vim
  - Configure it to use the nearest available copy of ESLint by searching up `node_modules`

# Formatting

## Prettier

We use Prettier with Expo-specific settings for most of our code formatting. These settings are in `.prettierrc` in the Expo repository. Most small decisions about how to format code disappear with Prettier so we think less about formatting when writing and reviewing code.

Sometimes Prettier makes code hard enough to read that we don’t want Prettier to format it. Add a `// prettier-ignore` comment above the expression whose formatting you want to preserve and let Prettier format the rest of the file.

```js
// prettier-ignore
let matrix = [
  -c,  1,  1,
    1, -c,  1,
    1,  1, -c,
];
```

If you would like Prettier to ignore the entire file rather than only a portion of it, add the file path to the `.prettierignore` file in the Expo repository.

Since Prettier formats entire files (except ignored lines), we need to keep our files “pretty” so that the next person who runs Prettier on a file reformats only the lines they’re changing in their commit. We’ll talk more about Prettier later in this document.

## Comments

Use `// line` comments in most places. Use `/** block */` comments above classes, methods, and other structures and use `/* inline block */` comments in the middle of lines:

```js
// CORRECT
/**
 * Gets the latest version of Android that's been released. This is a version
 * string like 7.1 instead of the code name Nougat.
 */
function getLatestAndroidVersion() {
  // Keep this logic in sync with Google's versioning scheme
  return maxBy(getAndroidVersions(/* includePrereleases */ false), linearizeSemver);
}
```

Remove commented-out code before pushing it to GitHub.

## Imports

(Note: we don’t programmatically sort nor check the order of imports since there currently isn’t a linter plugin for these choices. This section is meant to be read as light guidance and not for code reviewers to spend much attention on.)

Group and sort `import` statements and `require()` calls in this order:

1. `import` statements before `require()` calls
1. JavaScript hoists `import` statements; write the code to reflect that
1. Unassigned imports (`import 'side-effect'`) before assigned imports (`import React from 'react'`)
1. Unassigned imports almost always have side effects, which we usually want to apply earlier in the program’s lifetime.
1. External modules and Node.js built-in modules (`path`, `react`) before aliased internal modules (`www/module`) before relative modules (`../a/b`, `./c`)

```js
// CORRECT
import 'side-effect';

import invariant from 'invariant';
import Expo, { Audio } from 'expo';
import path from 'path';

import HomeScreen from '../screens/HomeScreen';
import Colors from '../style/Colors';
import calculateViewport from '../style/calculateViewport';
import LoginButton './LoginButton';

const assert = require('assert');
```

Within each group, sort the statements by the names of the imported modules, not their assigned variables. Use ASCII order: uppercase before lowercase before scoped modules.

```js
// CORRECT
import Z from 'Z';
import b from 'x';
import a from 'y';
import p from '@scope/package';
```

Write default imports before namespace imports before named imports:

````js
// CORRECT
import a, * as b, { c } from 'module';
``

## React and JSX

When writing React components, place your declarations and static methods near the top, followed by the constructor and lifecycle methods, followed by the render method and methods it calls, and other methods.

Use Prettier to format JSX.

```jsx
// CORRECT
type Props = {
  title: string,
  onPress?: event => void,
};

type State = {
  isPressed: boolean,
};

class Button extends React.Component {
  props: Props;
  state: State = {
    isPressed: true,
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      ...this.state,
      bounce: new Animated.Value(1),
    };
  }

  componentWillUnmount() {
    if (this.state.animation) {
      this.state.animation.stop();
    }
  }

  render() {
    return (
      <Animated.View
        onPress={this._handlePress}
        style={{ transform: [{ scale: this.state.bounce }] }}>
        <Text>
          {this.props.title}
        </Text>
      </Animated.View>
    );
  }

  _handlePress = event => {
    this._bounce();
    if (this.props.onPress) {
      this.props.onPress(event);
    }
  };

  _bounce() {
    this.setState(state => {
      state.bounce.setValue(0);
      let animation = Animated.spring(state.bounce, { toValue: 1 });
      animation.start(({ finished }) => {
        if (finished) {
          this.setState(() => ({ animation: null }));
        }
      });
      return { animation };
    });
  }
}
````

# Naming

Prioritize the reader when naming things. Choosing a greppable name tends to have a lot of benefits since it’s easier to find how the thing with the name is used, easier to rename and refactor, and is less context-sensitive.

```js
class TestPipeline {
  // PREFERRED
  runTests() { ... }

  // DISFAVORED
  run() { ... }
}

// "runTests" is a lot easier to grep for than "run". It also plainly communicates
// more about what it does without being too wordy.
```

## Classes, functions, and variables

Use camel case for all names. Capitalize the names of classes and constructor functions. Start other names with lowercase.

```js
// CORRECT
class Aquarium {
  filterWater() {...}
}

function Fish() {...}
Object.assign(Fish.prototype, ...);

function populateAquarium(aquarium, school) {...}
```

```js
// INCORRECT
class house {
  CloseWindows() {...}
}

function EstimatePrice(house) {...}
```

## Async functions

Name async functions and other functions that return promises with “Async” at the end if they may complete asynchronously. This communicates that the function does work (often I/O) asynchronously and we need to await its result.

```js
// CORRECT
async function fetchAccountAsync(accountId: ID): Promise<Account> { ... }
```

It doesn’t matter how the function creates a promise for its asynchronous work. If the function isn’t defined with the `async` keyword but still looks like an async function from its call site, use the same naming convention.

```js
// CORRECT
function readSettingsFileAsync(): Promise<string> {
  return Promise((resolve, reject) => {
    fs.readFile('settings.txt', 'utf8', ...);
  });
}
```

However, if a function does synchronous work but still returns a promise, it might make sense to omit the “Async” suffix.

```jsx
// OK
function multiplexPromises(promises: Promise<*>[]): Promise<Array<* | Error>> {
  // Given an array of promises, returns a promise that resolves to an array of
  // promise results or errors. Semantically, this function doesn't do asynchronous
  // work itself and the reader sees it operates on promises that do the actual work.
}
```

## Private variables

Use an underscore to prefix instance variables that are intended to be private. This strikes a nice balance between communicating that the variable stores private data while keeping it accessible in a simple way for debugging, tests, and (sparingly) patches.

```js
// CORRECT
class Counter {
  _currentNumber = 0;
  getNextNumber() { ... }
}
```

If it helps, use this same convention on variables that are internal to a module to make it clearer to readers which variables are defined and used only within the current module.

```js
// CORRECT
export default function prettyPrintAll(values) {
  for (let value of values) {
    _prettyPrint(value);
  }
}

function _prettyPrint(value) { ... }
```

## Boolean names

If it helps, consider naming Boolean variables with “is” or a similar verb at the beginning. Sometimes the names of Boolean variables can ambiguously describe an object (or program state) or reference an object, and using verbs like “is”, “was”, and “did” help communicate the variable’s purpose.

```js
// AMBIGUOUS
console.log(history.deleted);

// CLEAR
console.log(history.isDeleted);
console.log(history.deletedEntries);
```

# Examples

```js
import Expo from 'expo';
import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import Log from '../log/Log';
import Colors from '../style/Colors';

export default class GreetingText extends React.PureComponent {
  static propTypes = {
    greeting: PropTypes.string.isRequired,
    ...Text.propTypes,
  };

  componentDidUpdate() {
    Log.info('The greeting was re-rendered');
  }

  render() {
    let { greeting, style, ...props } = this.props;
    return (
      <Text {...props} onPress={this._handlePress} style={[styles.greeting, style]}>
        {greeting}
      </Text>
    );
  }

  _handlePress = event => {
    alert('Congratulations!');
  };
}

const styles = StyleSheet.create({
  greeting: {
    color: Colors.energetic,
    fontSize: 30,
  },
});
```

# Babel

We use Babel to enable some of the newer JavaScript features that are sufficiently stable for us. This mostly includes transforms for features that are in a finalized version of the JavaScript standard.

We use `babel-eslint`, which allows ESLint to use the Babel parser. In practice, with newer syntax extensions, Babel produces AST nodes that ESLint can’t consume; stable linter compatibility is another feature we look for in Babel plugins.
