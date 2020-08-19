---
title: iOS builds in depth
---

This page describes the process of building iOS projects with EAS Build. You may want to read this if you are interested in the implementation details of the build service.

## Build Process

Let's take a closer look at the steps for building iOS projects with EAS Build. We first run some steps on your local machine to prepare the project, and then we actually build the project on a remote service.

### Local Steps

The first phase happens on your computer. Expo CLI is in charge of completing the following steps:

1. Check if the git index is clean - this means if there aren't any uncommitted changes. If it's not clean an error is thrown.
2. Determine the bundle identifier for the project.

   If `expo.ios.bundleIdentifier` is specified in `app.json` but it doesn't match the bundle identifier in the Xcode project, then you will be asked which one to use. If you decide to use the one from `app.json` we will automatically update it in the Xcode project.

3. Prepare the credentials needed for the build.

   Depending on the value of `builds.ios.PROFILE_NAME.credentialsSource`, the credentials are obtained from either the local `credentials.json` file or from the Expo servers. If the `auto` or `remote` mode is selected but no credentials exist yet, you're offered to generate them.

4. Configure the Xcode project.

   4.1. Ensure the correct bundle identifier and Apple Team ID are set.

   4.2. Set the id of the provisioning profile resolved in the previous step.

5. Create the tarball containing all your project sources - run `git archive --format=tar.gz --prefix project/ -o project.tar.gz HEAD`.
6. Upload the project tarball to a private AWS S3 bucket and send the build request to EAS Build.

### Remote Steps

Next, this is what happens when EAS Build picks up your request:

1. Create a new macOS VM for the build.

   Every build gets its own, fresh macOS VM with all build tools installed there (Xcode, fastlane, and so on).

2. Download the project tarball from a private AWS S3 bucket and unpack it.
3. Run `yarn install` in the project root.
4. Run `pod install` in the `ios` directory inside your project.
5. Restore the credentials.

   5.1. Create a new keychain.

   5.2. Import the Distribution Certificate into the keychain.

   5.3. Write the Provisioning Profile to the `~/Library/MobileDevice/Provisioning Profiles` directory.

   5.4. Verify that the Distribution Certificate and Provisioning Profile match (every Provisioning Profile is assigned to a particular Distribution Certificate and cannot be used for building the iOS with any other certificate).

6. Create `Gymfile` in the `ios` directory if it does **not** exist (check out the [Default Gymfile](#default-gymfile) section).
7. Run `fastlane gym` in the `ios` directory.
8. Upload the build artifact to a private AWS S3 bucket.

   The artifact path can be configured in `eas.json` at `builds.ios.PROFILE_NAME.artifactPath`. It defaults to `ios/build/App.ipa`. You can specify a glob-like pattern for `artifactPath`. We're using the [fast-glob](https://github.com/mrmlnc/fast-glob#pattern-syntax) package under the hood.

## Building iOS Projects With Fastlane

We're using [fastlane](https://fastlane.tools/) for building iOS projects. To be more precise, we're using the `fastlane gym` command ([see the fastlane docs to learn more](https://docs.fastlane.tools/actions/gym/)). This command allows you to declare the build configuration in `Gymfile`.

EAS Build can use your own `Gymfile`. All you need to do is to place this file in the `ios` directory.

### Default Gymfile

If the `ios/Gymfile` file doesn't exist, the iOS builder creates a default one. It looks something like this:

```rb
suppress_xcode_output(true)
clean(true)

export_options({
  method: "app-store",
  provisioningProfiles: {
    "com.expo.eas.builds.test.application" => "dd83ed9c-4f89-462e-b901-60ae7fe6d737"
  }
})

export_xcargs "OTHER_CODE_SIGN_FLAGS=\"--keychain /tmp/path/to/keychain\""

output_directory("./build")
output_name("App")
```
