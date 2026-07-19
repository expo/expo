# Contributing to Expo for iOS

This guide provides an overview of what you need to know to contribute to the Expo iOS project. It does not touch specifically on how to build Expo SDK native modules; there is a separate guide for that.

## Prerequisites / Getting Started

To get the Expo Client running (on either platform), follow the README in the parent directory.

## Branch Organization

- We try to stay on, or near, `main`.
- When we release a new SDK version, we push a release branch of the form `ios/sdkNN`.
- Specific versions of the iOS Expo Client are tagged from that release branch, such as `ios/1.19.0`.
- New changes are written on `main`. When we cut a new release, we either cherry-pick from `main` to the release branch (for small changes) or just recreate the release branch.
- If we're near the end of a SDK cycle, we may be operating on a SDK candidate branch instead of `main`.

## Pull Requests

- Target `main` most of the time. If there's a SDK candidate branch (a few days near the end of the cycle), target that instead.
- We don't maintain an explicit style guide, so for now it's best to just observe what the rest of the codebase does and mimic that.
- Make sure your xcode file tree reflects the directory structure on disk.

## Contexts in which this project may run

This code can be run in a few contexts:

- As the Expo Client app.
- As a standalone (shell) app. In this case, the project is pre-built, and then some tooling modifies configurations in the NSBundle to cause it to run as a standalone app.

The `EXShellManager` class keeps track of how the code is being run. Mostly it reads the contents of a couple `.plist` files in the bundle.

## Dependencies

We use CocoaPods to manage dependencies. Rather than committing `Podfile`, we use `template-files/ios/dependencies.json`. To add a dependency:

- Add it to `dependencies.json`
- Run `et ios-generate-dynamic-macros`. This will write `Podfile` (for the Expo Client) and `ExpoKit.podspec` (for standalone apps, which use almost all of the same code as Expo Client, and therefore have the same dependencies).

## Testing

You can run our API tests from `apps/test-suite` against a native XCTest target called `ExponentIntegrationTests`.

1. Make sure `ExponentIntegrationTests/EXTestEnvironment.plist` contains a url to the `test-suite` project. If you are running from our monorepo, you can run `powertools configure-ios-test-suite-url` to do this automatically.
2. Open the workspace in Xcode and `Test` it. (Cmd+U)

## Versioning

Expo Client can run Expo projects using any of the last several Expo SDK versions. To support this, it includes native code for each of those SDK versions. This code lives under `versioned-react-native`.

Code for each SDK version includes a copy of React Native corresponding to that SDK version, as well as a set of Expo SDK classes. In order to prevent naming conflicts at compile time, all symbols in versioned code are prefixed.

Contributions to the Expo Client happened in "unversioned" code; that is, code which has not been included in an Expo SDK yet, without any symbol prefix.

To test changes in the "unversioned" code, change your `sdkVersion` from `app.json` to `UNVERSIONED`.

```json
{
  "expo": {
    "sdkVersion": "UNVERSIONED"
  }
}
```

## Project Architecture

The Expo Client is an iOS app containing the Expo Kernel. The Kernel is a piece of code which can run and manage multiple React Native apps at once. Most of the technical challenges of the codebase arise from these constraints:

- Multiple React Native bridges can be running at once.
- They can be running different versions of React Native from each other.
- They are sandboxed from one another.
- They may be production apps (minified, no dev tools) or development (running from a packager, possibly enabling dev tools).

### Expo Client entry point

Almost everything in the project is included in the ExpoKit library (see `ExpoKit.podspec`). The Expo Client is just a special user of ExpoKit. Therefore it includes some extra classes to provide an entry point to the application:

- `EXAppDelegate`: The app delegate. Try to keep this file small. Mostly it should call into `ExpoKit` methods, unless you really want to add functionality that is specific to Expo Client and should not work in standalone apps.
- `EXRootViewController`: Same story as AppDelegate. This implements any view controller functionality which only needs to apply to Expo Client and not standalone apps.

### Versioned directory

Everything under this directory will be duplicated and namespaced when we release the next SDK version. It includes:
- All of the Expo SDK native modules, components, view managers, etc. This code is the "unversioned" Expo SDK.
- A few utility classes which help run namespaced and scoped modules. In particular, any utilities which need to be namespaced/duplicated with each SDK version.
- You can see older versions of this directory under `versioned-react-native/ABI*/Exponent`.

### ExpoKit directory

This contains the public ExpoKit API exposed by the ExpoKit CocoaPod, which basically ends up being used only in standalone iOS apps.

### ReactAppManager

A ReactAppManager owns a single React Native bridge and root view. There are two subclasses: `EXKernelReactAppManager`, which owns a privileged instance of the Expo Home experience, and `EXFrameReactAppManager`, which owns a normal (non-Home) Expo app.

There may be many instances of `EXFrameReactAppManager` at once, but there will only ever be one instance of `EXKernelReactAppManager`.

A ReactAppManager keeps track of the lifecycle of a React Native app. Though it is unversioned, it uses reflection to instantiate a versioned bridge and root view and act as their delegate. It also acts as an interface to their devtools. ReactAppManager utilities which need to be versioned are contained in EXVersionManager.

### Kernel directory

This directory contains the native code powering the Expo kernel. Here's roughly how the kernel is structured:

![image](https://user-images.githubusercontent.com/1316332/29846489-f362b0c6-8ccb-11e7-8d69-a4bebaf19c70.png)

The Bridge Registry keeps track of all the React Native bridges running at a given time, including where they are in their loading/error lifecycle, which one is visible to the user, which one (if any) is being developed from a packager, etc.

Each bridge is wrapped in a ReactAppManager (explained elsewhere in this guide).

The Services Registry contains a set of "services" which represent shared device resources. They are singleton and unversioned. Native modules in the Expo SDK have a mechanism for receiving a pointer to an unversioned kernel service at runtime (see `EXScopedModuleRegistry` for details). It is their job to broker shared device resources between various sandboxed and versioned React Native apps.
