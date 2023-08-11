# eslint-config-universe
Shared ESLint configs for Node, Web, and universal Expo projects.

## Installation

```sh
yarn add --dev eslint-config-universe
```

You will also need to install `eslint` and `prettier`:

```sh
yarn add --dev eslint prettier
```

## Usage

Import this config into your own ESLint configuration using the `extends` option. ESLint checks both `package.json` and `.eslintrc.*` files for its configuration:

### package.json
```js
{
  "eslintConfig": {
    // Choose from universe/native, universe/node, universe/web
    "extends": "universe"
  }
}
```

### .eslintrc.js
```js
module.exports = {
  extends: 'universe',
};
```

## Customizing Prettier

If you would like to customize the Prettier settings, create a file named `.prettierrc` in your project directory. An example of Prettier configuration file:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": true,
  "bracketSameLine": true
}
```

Read more about [configuring `prettier`](https://prettier.io/docs/en/configuration.html) and [all of the available options](https://prettier.io/docs/en/options.html).

## Support for Different Platforms

There are several configs for different platforms. They are:
* `universe`: the basic config for JavaScript projects for which there isn't a more specific config,
* `universe/native`: the config for React Native projects, including Expo projects, with support for React and JSX,
* `universe/web`: the config for code that runs in web browsers, with support for React and JSX,
* `universe/node`: the config for code that runs in Node.

For an Expo project, your configuration might look like this:

```js
"eslintConfig": {
  "extends": "universe/native"
}
```

You also can extend multiple configs, which is useful for projects that span several platforms:

```js
"eslintConfig": {
  "extends": ["universe/node", "universe/web"]
}
```

## Optional Additional TypeScript Typed Linting

Universe also provides optional additional config for `typescript-eslint` rules that make use of the parsed type information. Note that this may increase the time it takes to run lint for large projects. More information can be found at [TypeScript ESLint website](https://typescript-eslint.io/docs/linting/type-linting).

To enable the additional config, the following changes to your config are required:

### .eslintrc.js

```diff
module.exports = {
  extends: [
    'universe',
+   'universe/shared/typescript-analysis',
  ],
+ overrides: [
+   {
+     files: [
+       '*.ts',
+       '*.tsx',
+       '*.d.ts'
+     ],
+     parserOptions: {
+       project: './tsconfig.json'
+     },
+   },
+ ],
};
```

More information on `parserOptions.project` option can be found in the [`typescript-eslint` repository](https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/parser#parseroptionsproject).

## Philosophy

This config is designed to mark severe problems (ex: syntax errors) as errors and stylistic issues as warnings. This lets your team apply policies like, "make sure a commit has no errors but ignore warnings if the commit didn't introduce them."

It's also designed to be a more lenient config for teams who are stronger at decision-making and have a culture of osmotically learning coding guidelines and benefit more from flexibility than rigid rules.
