---
title: Android builds in depth
---

This page describes the process of building Android projects with EAS Build. You may want to read this if you are interested in the implementation details of the build service.

## Build Process

Let's take a closer look at the steps for building Android projects with EAS Build. We first run some steps on your local machine to prepare the project, and then we actually build the project on a remote service.

### Local Steps

The first phase happens on your computer. Expo CLI is in charge of completing the following steps:

1. Check if the git index is clean - this means that there aren't any uncommitted changes. If it's not clean, an error is thrown. We use git to prepare a tarball of your project to upload to the build service.
2. Prepare the credentials needed for the build unless `builds.android.PROFILE_NAME.withoutCredentials` is set to `true`.

   Depending on the value of `builds.android.PROFILE_NAME.credentialsSource`, the credentials are obtained from either the local `credentials.json` file or from the Expo servers. If the `auto` or `remote` mode is selected but no credentials exist yet, you're offered to generate a new keystore.

3. Check if the Android project is configured to be buildable on the EAS Build servers.

   In this step, Expo CLI checks whether `android/app/build.gradle` contains `apply from: "./eas-build.gradle"`.
   If the project is not configured, Expo CLI runs auto-configuration steps ([learn more below](#project-auto-configuration)).

4. Create the tarball containing your project sources - run `git archive --format=tar.gz --prefix project/ -o project.tar.gz HEAD`.
5. Upload the project tarball to a private AWS S3 bucket and send the build request to EAS Build.

### Remote Steps

Next, this is what happens when EAS Build picks up your request:

1. Create a new Docker container for the build.

   Every build gets its own, fresh container with all build tools installed there (Java JDK, Android SDK, NDK, and so on).

2. Download the project tarball from a private AWS S3 bucket and unpack it.
3. Run `yarn install` in the project root.
4. Restore the keystore (if it was included in the build request).
5. Run `./gradlew COMMAND` in the `android` directory inside your project.

   `COMMAND` is the command defined in your `eas.json` at `builds.android.PROFILE_NAME.gradleCommand`. It defaults to `:app:bundleRelease` which produces the AAB (Android App Bundle).

6. Upload the build artifact to AWS S3.

   The artifact path can be configured in `eas.json` at `builds.android.PROFILE_NAME.artifactPath`. It defaults to `android/app/build/outputs/**/*.{apk,aab}`. We're using the [fast-glob](https://github.com/mrmlnc/fast-glob#pattern-syntax) package for pattern matching.

## Project Auto-Configuration

Every time you want to build a new Android app binary, we validate that the project is set up correctly so we can seamlessly run the build process on our servers.

### Android Keystore

Android requires you to sign your application with a certificate. That certificate is stored in your keystore. The Google Play store identifies applications based on the certificate. It means that if you lose your keystore you may not be able to update your application in the store. However, with [Play App Signing](https://developer.android.com/studio/publish/app-signing#app-signing-google-play), you can mitigate the risk of losing your keystore.

Your application's keystore should be kept private. **Under no circumstances should you check it in to your repository.** Debug keystores are the only exception because we don't use them for uploading apps to the Google Play store.

### Configuring Gradle

Let's focus on building a release app binary. Like we previously mentioned, your app binary needs to be signed with the keystore. Because we're building the project on a remote server we had to come up with a way of providing Gradle with the credentials which are not checked in to the repository. When running `expo eas:build --platform android`, we're writing the `android/app/eas-build.gradle` file with the following contents:

```groovy
android {
  signingConfigs {
    release {
      // This is necessary to avoid needing the user to define a release signing config manually
      // If no release config is defined, and this is not present, build for assembleRelease will crash
    }
  }

  buildTypes {
    release {
      // This is necessary to avoid needing the user to define a release build type manually
    }
  }
}

project.afterEvaluate {
  /* @info This is where we configure the release signing config */android.signingConfigs.release/* @end */ { config ->
    def debug = gradle.startParameter.taskNames.any { it.toLowerCase().contains('debug') }

    /* @info Don't read credentials.json if the task name contains debug */
    if (debug) {
      return
    }
    /* @end */

    def credentialsJson = rootProject.file("../credentials.json");

    if (credentialsJson.exists()) {
      /* @info Don't do anything if the release signing config is already defined in build.gradle */
      if (config.storeFile) {
        println("Path to release keystore file is already set, ignoring 'credentials.json'")
      }/* @end */ else {
        try {
          def credentials = new groovy.json.JsonSlurper().parse(credentialsJson)

          /* @info Use the data from credentials.json for the signing config */
          storeFile rootProject.file("../" + credentials.android.keystore.keystorePath)
          storePassword credentials.android.keystore.keystorePassword
          keyAlias credentials.android.keystore.keyAlias
          keyPassword credentials.android.keystore.keyPassword /* @end */ 
        } catch (Exception e) {
          println("An error occurred while parsing 'credentials.json': " + e.message)
        }
      }
    } else {
      if (config.storeFile == null) {
        println("Couldn't find a 'credentials.json' file, skipping release keystore configuration")
      }
    }
  }

  /* @info Use the above signing config for the release build type */
  android.buildTypes.release { config ->
    config.signingConfig android.signingConfigs.release
  } /* @end */

}
```

The most important part is the `release` signing config. It's configured to read the keystore and passwords from the `credentials.json` file at the project root. Even though you're not required to create this file on your own, it's created and populated with your credentials by EAS Build before running the build. Please note that if `android.signingConfigs.release.storeFile` is already specified in your `build.gradle` we will **not** override your configuration.

This file is imported in `android/app/build.gradle` like this:

```groovy
// ...

apply from: "./eas-build.gradle"
```

All these changes must be committed to the repository. If Expo CLI configured the project in the current run of `expo eas:build --platform android`, you should be asked if the commit should be made automatically.
