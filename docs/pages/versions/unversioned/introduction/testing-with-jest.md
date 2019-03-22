---
title: Testing with Jest
---

Jest is the most widely used JavaScript unit testing framework, so you may be even be familiar with it already. This guide explains how to set up Jest in your project, write a snapshot test, write a unit test, and common problems that people encounter when using Jest in React Native.

## Installation

First we need to install jest-expo: `yarn add jest-expo --dev` **or** `npm i jest-expo --save-dev`

Then we need to add/update `package.json` to include:

```js
"scripts": {
  ...
  "test": "jest"
},
"jest": {
  "preset": "jest-expo"
}
```

Now let's add [enzyme](https://airbnb.io/enzyme/), [enzyme adapter for react < 16](https://airbnb.io/enzyme/#upgrading-from-enzyme-2x-or-react--16) and [react-dom](https://github.com/facebook/react/tree/master/packages/react-dom):

`yarn add react-dom enzyme enzyme-adapter-react-16 --dev` **or** `npm i react-dom enzyme enzyme-adapter-react-16 --save-dev`

With enzyme's adapter for react < 16, we need to have this set up before every test that runs. Jest gives us a way to do that, head back over to `package.json`:

```js
"jest": {
  "preset": "jest-expo",
  "setupFiles": [
    "<rootDir>/jest.setup.js"
  ]
}
```

Now create the file `jest.setup.js`

```js
import { configure } from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
```

That's it! Now we can start writing Jest tests!

## My First Jest Test

We are going to write a test for `App.js` by creating `App.test.js`, Jest will identify this as a test, and include it in the tests queue. There are other ways to [structure your tests](#structure-your-tests), but we will cover that later in this tutorial.

`App.test.js`:
```js
import React from 'react';
import { shallow } from 'enzyme';

import App from './App';

const shallowApp = shallow(<App />);

describe('<App />', () => {
  it('renders correctly', () => {
    expect(shallowApp).toMatchSnapshot();
  });
});
```

Now run `yarn test` or `npm run test`, if all went well you should see a snapshot created and 1 test passed!

> **Node Version**: If you are running node version 11.11, [Jest will throw errors](https://github.com/facebook/jest/issues/8069), please downgrade or upgrade to 11.12+

This was a very simple test, for more information take a look at the following links:

- [Api: Globals](https://jestjs.io/docs/en/api)
- [Api: Mock Functions](https://jestjs.io/docs/en/mock-function-api)
- [Cli Options](https://jestjs.io/docs/en/cli)

## Code Coverage Reports

Running tests are cool and all, but wouldn't you like to see your Expo projects total code coverage?! Maybe even see it in html format?! This section is for you!

Let's head back to `package.json` and add the following:

```js
"jest": {
  ...
  "collectCoverage": true,
  "collectCoverageFrom": [
    "**/*.{js,jsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/jest.setup.js"
  ],
  "verbose": true
}
```

The above additions let's Jest know to collect coverage of all ***.js & .jsx*** file types and not within ***/coverage***, ***/node_modules/*** and our 2 project config files (add/remove more exclusions to this list to match your Expo app needs). With [verbose](https://jestjs.io/docs/en/cli#verbose) set as true.

Now run the test again, you should see **/coverage/** in your app directory! Find the `index.html` file within and double click to open it up in a browser. Not only do we have reporting in our cli, we also have an html version of our code coverage, pretty cool stuff!

> **Note**: You probably don't want to upload the html reporting to git, so please remember to add `coverage/\*\*/*` as a line in `.gitignore`

## Structure your Tests

As promised, let's talk about how to set up the tests, right now we have a single `.test.js` in the root of our Expo project. This can get messy quickly, the easiest way is to create a `__tests__` directory (anywhere you'd like) and put all the tests there. For example see below:

```bash
__tests__/
├─ components/
│  └─ button.test.js
├─ navigation/
│  └─ mainstack.test.js
└─ screens/
   └─ home.test.js
src/
├─ components/
│  └─ button.js
├─ navigation/
│  └─ mainstack.js
└─ screens/
   └─ home.js
```

This **could** cause a lot of long import paths though (`../../src/components/button`), so another option would be to have multiple `__tests__` directories:

```bash
src/
├─ components/
├─ __tests__/
│  │  └─ button.test.js
│  └─ button.js
...
```

So if we move `__tests__` within `components`, the *button.test.js* import of `<Button />` would now be: `../button`, that's a lot better!

Another option for test/file structure:

```bash
src/
├─ components/
│  ├─ button.js
│  ├─ button.style.js
│  └─ button.test.js
...
```

At the end of the day, it's all preference and up to you on how you'd like to structure things, but we wanted to share a few options to consider.

## Jest Flows

This is optional, but wanted to talk about different jest test flows. Currently we run the test and that's it, but take a look at the [Cli Options](https://jestjs.io/docs/en/cli). Below are a few script setups to try:

```js
"scripts": {
  ...
  // active development of tests, watch files for changes and re-runs all tests
  "test": "jest --watchAll --coverage=false",

  // debug, console.logs and only re-runs the file that was changed
  "testDebug": "jest -o --watch --coverage=false --verbose=false",

  // displays code coverage in cli and updates the code coverage html
  "testFinal": "jest",

  // when a screen/component is updated, the test snapshots will throw an error, this updates them
  "updateSnapshots": "jest -u --coverage=false"
}
```
