# Expo for Web

> All information here is "pre-rc" and subject to changes.

Expo for web brings all of the high-quality modules you've come to expect from React Native to the Web. Building on top of React Native for Web, Expo removes all of the complexity and makes it easy to create responsive mobile-web experiences.

The high-level goals of this project:

- Be highly universal with little-to-no lock-in.
- Actually maximize code reuse.
- Dig deep to make sure our modules emulate native features as best they can.
- Reuse native configurations to create high-fidelity progressive web apps. (PWA)
- Enable community members to contribute to Platform Modules.

## Examples

Check out the examples of Expo for web:

- [Native Component List](https://github.com/expo/expo/tree/master/apps/native-component-list/)
- [Test Suite](https://github.com/expo/expo/tree/master/apps/test-suite/)

## Terminology

- Platform Module: The term "native module" is partly confusing since "web native modules" are written in JS for the DOM; in this context, "native" refers to using the web platform while in other contexts, "native" refers to Objective-C, Java, and so on. Because of this ambiguity, we now refer to "native modules" as "platform modules".
- Unimodule: An agnostic Platform Module that uses the universal [`expo-core`](https://github.com/expo/expo/tree/master/packages/expo-core) package.
- `[front-end]`: The "front-end" represents the user-facing side of a Unimodule.
- `[back-end]`: The platform specific API of a Unimodule. For instance: Objective-C, Java, & JavaScript.

## Platform Modules

A platform module is an agnostic native module that can run in on platform. Utilizing the universal [`expo-core`](https://github.com/expo/expo/tree/master/packages/expo-core) package, a platform module consists of a native-layer and an API-layer.

- API-layer: The developer-facing side of a Unimodule that interfaces with the native-layer.
- Native-layer: The platform specific API of a Unimodule. For instance: Objective-C, Java, & JavaScript.

Some of the established standards of a platform module:

- Currently all alterations to modules should be written in TypeScript.
- All unimplemented methods should be detected, and an `UnavailabilityError` from `expo-errors` should be thrown.
- Avoid creating platform specific features in a single file of the API-layer. Instead create platform specific files like: `.ios.ts`, `.android.ts`, `.web.ts`, `.native.ts`.

### Tracking progress

We are currently making all changes in the [Expo/Expo monorepo with the **[web]** tag](https://github.com/expo/expo/pulls?utf8=%E2%9C%93&q=is%3Apr+label%3A%22project%3A+web%22+)

### Contributing

Initially you should clone [expo](https://github.com/expo/expo) and work in `apps/` & `packages/`. The following process will outline how to add web support to existing Unimodules.

#### New Features

Please feel free to open an issue with a proposal for a new feature or refactoring before
starting on the work. We don't want you to waste your efforts on a pull request
that we won't want to accept.

#### Pull requests

**Before submitting a pull request**, please make sure the following is done:

1. Fork the repository and create your branch from `master`.
2. If you've added code that should be tested, add tests!
3. If you've changed APIs, update the documentation.
4. Ensure the tests pass (`yarn test`).

After you've done all of these, you can submit a pull request, filling out the PR template and linking any issues it addresses.

Please try to keep your pull request focused in scope and avoid including
unrelated commits.

After you have submitted your pull request, we'll try to get back to you as
soon as possible. We may suggest some changes or improvements.

Thank you for contributing!

#### Releases

To commit, publish, and push a final version:

```sh
yarn release <version>
```

Release candidates or versions that you'd like to publish to npm, but do not
want to produce a commit and push it to GitHub:

```sh
yarn release <version> --skip-git
```
