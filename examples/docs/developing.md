# Developing

There are a couple different things you could work on in regards to Expo for web. Here we'll cover how you can setup your environment to easily contribute.

# 💎 Features & Tests

To work on modules like `expo-camera` or even community libraries, I like to work in the expo monorepo, this is because it's a yarn workspace which links the packages really well.

- Clone the repo `git clone git@github.com:expo/expo.git`
- [Set up the project](https://github.com/expo/expo/#set-up).
- I also tend to run `git submodule init && git submodule update && git submodule foreach --recursive git checkout . && git lfs pull` just to be safe! 😄

Now to develop Unimodules, work on apps in the `expo/apps` folder.
These will use the modules in the `expo/packages` folder, meaning you don't need to worry about accidentially erasing changes by working in `node_modules` 😬.

## Working on modules

For example if you want to work on `react-navigation`, clone it to `expo/packages/react-navigation` and run `yarn`, now projects like `expo/apps/native-component-list` will use your local copy of navigation and update when you make changes.

## Best Practices

For absolute best practices, I use the `expo-module-scripts` which unify the TypeScript configuration and make testing really easy. The setup looks something like this:

- Add the following to the **`package.json`**:
  ```js
  "scripts": {
      "build": "expo-module build",
      "clean": "expo-module clean",
      "test": "expo-module test",
      "prepare": "expo-module prepare",
      "prepublishOnly": "expo-module prepublishOnly",
      "expo-module": "expo-module"
  },
  "devDependencies": {
      "expo-module-scripts": "^1.0.0"
  },
  "jest": {
      "preset": "expo-module-scripts"
  },
  ```
- Bonus, you can add the following to your **`package.json`**:
  ```js
  // This means that babel can remove unused code, learn more here: https://webpack.js.org/guides/tree-shaking/
  "sideEffects": false,
  // Use the name of the module as the main entry point, notice that we point to the build folder.
  "main": "build/Localization.js",
  "types": "build/Localization.d.ts",
  // Help people find the code from NPM
  "repository": {
      "type": "git",
      "url": "https://github.com/expo/expo.git"
      // Set the sub directory since it's a monorepo
      "directory": "packages/expo-localization"
  },
  // why not ¯\_(ツ)_/¯
  "contributors": [
    "Evan Bacon <bacon@expo.io> (https://github.com/evanbacon)"
  ],
  ```

When you are developing unimodules, run `yarn build` in the package. ex: `cd expo/packages/expo-camera/ && yarn build`.
Now TS will be running for that project and changes you make will be reflected in the `apps/` projects you are running.

# 👑 CLI

If you want to work on the CLI, webpack config, PWA generation, or bootstrapping this is what you want! If you aren't planning on making changes to the CLI, you can just use `npm i -g expo-cli` and start projects with `expo start --web`.

- Set up `expo-cli`
- Clone the repo `git clone git@github.com:expo/expo-cli.git`
- [Set up the project](https://github.com/expo/expo-cli/blob/master/CONTRIBUTING.md#setting-up-the-repository-for-development).

## Global Usage

You will probably want to test your changes by starting expo projects outside of the expo-cli repo. To do this easily you can do the following:

- Run `yarn start` in the root of the `expo-cli/` repo (have this running while making changes).
- Add an alias on your computer by opening the bash profile (`code ~/.bash_profile`).
- Add the line `alias expod="/Users/evanbacon/Documents/GitHub/expo-cli/packages/expo-cli/bin/expo.js"` but with your local `expo-cli` path.
- Restart the terminal.
- Now when you want to use debug features run `expod` instead of `expo`.

# 📚 Docs & Guides

Currently we are temporarily adding documentations to this repo (`web-examples`). In the future we will move this to [Expo Docs](https://docs.expo.io). Until then, you can open issues or pull requests with new documentation, ideas, or questions here! 😁
