We've set up the Expo SDK to help us keep it reliable and clean and be confident in the changes we're making to it.

## Getting Started

Make sure you can run the unit tests, lint and TypeScript:
```sh
yarn test  # This starts the test watcher
yarn lint
yarn tsc
```

## Testing in an App

The Expo repository is carefully configured so changes to the `expo` package show up when running one of the development apps under `apps` like `native-component-list`. Be sure to compile the TypeScript to JavaScript in order to test your code.

## Unit tests

The first thing we do when working on the Expo SDK is to start the unit test watcher:
```sh
yarn test
```

This starts Jest, the test runner we use. Jest looks at the files you've modified and runs tests that may be affected. Jest also watches your filesystem and re-runs affected tests when you make a change. As we develop in the Expo SDK, we get quick feedback on the effect of our changes.

When you write code, whether you're adding a new module or changing an existing one, it's usually easy (and expected of you) to write tests. Tests go in a file named `__tests__/${module}-test.js`. Read the [Jest docs](https://facebook.github.io/jest/) if you're new to Jest. The Jest API docs are also really helpful for learning about Jest's features and methods.

### Keep them fast!

Our unit tests are part of our synchronous workflow – make changes, see their effects – so we need to keep them fast. One way to do this is to tightly define the unit of code that is tested and minimize the integrations within your units.

Your unit is defined by its interface on both sides: its callers and the code it calls. Jest's mocking system is fairly powerful and lets you mock modules that your code calls. This lets you constrain the unit you are testing.

### A few tests go a long way

The most valuable tests are ones that test complex code or code paths that are rarely taken. For example, we're less likely to manually run code that runs only once (ex: asking for permissions) and discover bugs or regressions in it, so it's especially good to test that code.

We don't aim for 100% coverage. We want well-placed tests that keep the Expo SDK easy to work on with confidence. Having lots of tests can overfit the current code and make it more tedious to make changes.

Finally, unit tests can go a long way. The first project that used Jest (before it was called Jest) relied on unit tests, heavily used mocking, shipped on time, and fixed several reliability issues users had with the previous version of the product.

## Integration tests

Our integration tests are under `apps/test-suite` in the Expo repository. The `test-suite` project
is an Expo project we run on our devices. It also can run in the simulator but has access to fewer
APIs.

If you make changes to native code, update `test-suite` too.

## Continuous Integration

When a PR to Universe or a commit to the main branch contains changes to the Expo SDK, CI will run the Expo SDK tests as well as the integration test suite. CI also runs the linter and TypeScript. We need to keep the CI status green. You are responsible for the code you write!

## Linting

We use ESLint with Prettier to detect some bugs and apply some of our style and formatting conventions. Before sending a PR, run `yarn lint` to make sure the Expo SDK stays clean. You also can run `yarn lint --fix` to automatically fix several lint errors and warnings and run Prettier.

Most popular editors have ESLint plugins. They show errors and warnings inline and add commands to auto-fix them.

Each of us is responsible for keeping the Expo SDK clean, like how we're responsible for tests and the code we write.

## TypeScript type checking

We use TypeScript to add types to the Expo SDK, primarily for Expo developers using the SDK. TypeScript types also can add more confidence in the correctness of our implementation. Run TypeScript with `yarn tsc`. You also can run `watch -t yarn tsc` to re-run TypeScript when you make changes.

When you use TypeScript in a file, use a `.ts` or `.tsx` file extension, add type hints, and make sure that `yarn tsc` passes on your file.
