<!-- @ref llp/0002-testing-and-evals.plan.md -->

# broken-app

The "make this project start" fixture. It has exactly **one** breakage, so a test or an eval
scenario can attribute a failure to a single cause:

> `package.json` lists `fake-native-module` as a dependency, but `node_modules/fake-native-module`
> does not exist.

Everything else is valid: `app.json` parses, `expo` and `expo-camera` are installed, and the stub
`expo` bin works like it does in the other fixtures.

The breakage is deliberately the kind an install fixes. `expo` and `expo-camera` stay installed so
that the CLI can still resolve the project — the failure is about the missing package, not about an
empty `node_modules`.

Keep it at one breakage. If a scenario needs a different failure (unparsable `app.json`, an SDK
version mismatch, a missing `expo` package), add a sibling fixture instead of stacking a second
problem in here.
