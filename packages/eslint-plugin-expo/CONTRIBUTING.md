## Creating a new rule

We use [generator-eslint](https://github.com/eslint/generator-eslint) for the folder structure and rule generation. This ensures a consitent rule layout, and allows for a lot of the documentation to be generated automatically.

First, ensure you Yeoman, Node.js and generator-eslint installed globally:

```sh
npm i -g yo
npm i -g generator-eslint
```

Then to create a new rule, run ththe following at the project root level:

```sh
yo eslint:rule
```

You will be prompted to enter information about the new rule after which the plugin will create files for the rule, test and documentation.

First add some test cases to check the validity of your error in `tests/lib/rules`.

Then implement your rule in `lib/rules` (run `yarn test` to run the tests). The [AST explorer](https://astexplorer.net/) might come in handy here when writing the rule.

Now update the documentation for the new rule in `docs/rules`.

And finally, run `yarn update:eslint-docs` to update the documentation with details about the new rule.
