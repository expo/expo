---
title: EAS Builds in 5 Minutes
---

Let's get started by building Android and iOS app binaries for a fresh bare project initialized with Expo CLI.

## Prerequisites

- Install Expo CLI by running `npm install -g expo-cli` (or `yarn global add expo-cli`). *If you already have it, make sure you're using the latest version.* EAS Builds is in alpha and it's changing rapidly, so the only way to ensure that you will have a good experience is to use the latest expo-cli version. **This tutorial assumes you're using `expo-cli@3.23.2` or newer.**
- Sign in with `expo login` or sign up with `expo register` if you don't have an Expo account yet. You can check if you're logged in by running `expo whoami`.

## Initialize a New Project

Run `expo init PROJECT_NAME` (let's assume `PROJECT_NAME` is `abcd`) and choose a bare workflow template (either `minimal` or `minimal (TypeScript)`).

<center><img src="/static/images/eas-builds/5-minute-tutorial/01-init.png" /></center>

Initializing the project can take a few minutes. Once it's all set, you should see `✅ Your project is ready!` in logs.

<center><img src="/static/images/eas-builds/5-minute-tutorial/02-init-complete.png" /></center>

Expo CLI creates a git repository for you. However, some changes are not commited by default. Go into the project directory, review the changes, and commit them:

- `cd abcd`
- `git add .`
- `git commit -m "Add Podfile.lock, yarn.lock, etc."`

<center><img src="/static/images/eas-builds/5-minute-tutorial/03-initial-commit.png" /></center>

## Create eas.json

The next step towards building your native project with EAS Builds is creating the `eas.json` file in the root directory. It will contain the EAS Builds configuration. Create the file with the following contents:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    },
    "ios": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

This is a minimal example configuration for Android and iOS builds. It defines a single build profile named `release` (you can have multiple build profiles like `release`, `debug`, `testing`, etc.) for each platform. Each profile declares that the project is a generic React Native project (unlike a managed Expo project which doesn't contain native code in the project tree).

After creating the file, make another commit:

- `git add eas.json`
- `git commit -m "Add eas.json"`

<center><img src="/static/images/eas-builds/5-minute-tutorial/04-eas-json.png" /></center>

If you want to learn more about `eas.json` see the [Configuring with eas.json](https://todo) page.

Once you've created `eas.json`, new Expo CLI commands should become available for you:

- `expo eas:build` - manages the whole build process, which consists of: credentials management, project auto-configuration, running the build, and waiting for it to finish
- `expo eas:build:status` - displays the status of your latest build for this project

## Building For Android

### Configuring the Android Project

> We're working on streamlining this process. It'll look differently in the future. Stay tuned.

So far, we've configured EAS Builds with `eas.json`. Now is the time to make the Android code buildable on our servers. All you need to do is provide your app's credentials to EAS Builds. For an Android application, a keystore, keystore password, key alias, and key password are needed to build the app binary.

Expo CLI will help you generate the keystore. However, we need to tell `gradle` where it should look for the credentials.
Open `android/app/build.gradle` and make the following changes:

```diff
diff --git a/android/app/build.gradle b/android/app/build.gradle
index 980625b..4388b3b 100644
--- a/android/app/build.gradle
+++ b/android/app/build.gradle
@@ -152,15 +152,20 @@ android {
             keyAlias 'androiddebugkey'
             keyPassword 'android'
         }
+        release {
+            def credentialsJson = new groovy.json.JsonSlurper().parse(rootProject.file("../credentials.json"))
+            storeFile rootProject.file("../" + credentialsJson[android"]["keystore"]["keystorePath"])
+            storePassword credentialsJson["android"]["keystore"]["keystorePassword"]
+            keyAlias credentialsJson["android"]["keystore"]["keyAlias"]
+            keyPassword credentialsJson["android"]["keystore"]["keyPassword"]
+        }
     }
     buildTypes {
         debug {
             signingConfig signingConfigs.debug
         }
         release {
-            // Caution! In production, you need to generate your own keystore file.
-            // see https://facebook.github.io/react-native/docs/signed-apk-android.
-            signingConfig signingConfigs.debug
+            signingConfig signingConfigs.release
             minifyEnabled enableProguardInReleaseBuilds
             proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
         }
```

We're defining here a new signing config (`release`) and using it for the `release` build type. The code in the `release` signing config is reading the keystore configration from the file named `credentials.json`. You don't need to create this file manually. It'll be automatically created on our build servers and populated with the credentials you generate (or provide) with Expo CLI. Using your own `credentials.json` is an advanced feature of EAS Builds. You can learn more about it in the [Advanced Credentials](https://todo) page.

After making the changes to the `build.gradle` file, commit them:

- `git add android/app/build.gradle`
- `git commit -m "Configure Android project"`

<center><img src="/static/images/eas-builds/5-minute-tutorial/05-configure-android.png" /></center>

### Running the Build

Building the Android app binary is simple - just run `expo eas:build --platform android` and you'll be guided through generating or providing your own keystore. For the sake of simplicity in this tutorial, select `Generate new keystore` and hit `ENTER`.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

<center><img src="/static/images/eas-builds/5-minute-tutorial/06-generate-keystore.png" /></center>

The build should start soon after that. Expo CLI will print a URL to the page where you can monitor the build (and view logs). Open the URL in a browser and you should see a page like this:

<center><img src="/static/images/eas-builds/5-minute-tutorial/07-build-progress.png" /></center>
<center><img src="/static/images/eas-builds/5-minute-tutorial/08-build-logs.png" /></center>

Once the build completes you can download the app binary by either visiting the build status page (and clicking the download button), or by opening the URL printed by Expo CLI:

<center><img src="/static/images/eas-builds/5-minute-tutorial/09-build-completed-website.png" /></center>
<center><img src="/static/images/eas-builds/5-minute-tutorial/10-build-completed-cli.png" /></center>

## Building for iOS

### Set the Bundle Identifier

Open `app.json` and set the bundle identifier (`expo.ios.bundleIdentifer`) that will be used to identify your application on the Apple App Store.

An excerpt from Apple's docs:

> The bundle identifier string identifies your application to the system. This string must be a uniform type identifier (UTI) that contains only alphanumeric (A-Z,a-z,0-9), hyphen (-), and period (.) characters. The string should also be in reverse-DNS format. For example, if your company’s domain is Ajax.com and you create an application named Hello, you could assign the string com.Ajax.Hello as your application’s bundle identifier.

After setting the bundle identifier, commit the change:

- `git add app.json`
- `git commit -m "Set bundle identifier"`

<center><img src="/static/images/eas-builds/5-minute-tutorial/11-set-bundle-id.png" /></center>

### Running the Build

Run `expo eas:build --platform ios` and you'll be guided through generating the app's credentials and configuring your iOS project.

You'll be asked which bundle identifier to use. Choose the one defined in `app.json`:

<center><img src="/static/images/eas-builds/5-minute-tutorial/12-choose-bundle-id.png" /></center>

Follow the next steps (generating credentials and auto-configuring your Xcode project) and you'll be provided with the URL to the build logs page.

**Warning: If you've previously set up credentials for an app with the same slug, Expo CLI will try to reuse them.**

<center><img src="/static/images/eas-builds/5-minute-tutorial/13-ios-build-in-progress.png" /></center>

Once the build completes you can download the app binary the same way you did with the Android counterpart - either via the build status page or opening the URL that's printed to your console.

<center><img src="/static/images/eas-builds/5-minute-tutorial/14-ios-build-completed.png" /></center>
