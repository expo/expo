## Creating a new rule

To create a new rules, add the following files:
- `src/rules/newRule.ts`
- `src/__tests__/newRule.ts`
- `docs/rules/newRule.md`

and make sure you add the new rule to `src/rules/index.ts`.

Now you can implement your rule in `src/rules` (run `yarn test` to run the tests). The [AST explorer](https://astexplorer.net/) can come in handy here when writing the rule.

Now update the documentation for the new rule in `docs/rules`.

And finally make sure it's added to the table and config in `README.md`.
