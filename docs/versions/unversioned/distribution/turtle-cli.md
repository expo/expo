---
title: Building Standalone Apps on Your CI
---

> **WARNING:** This feature is in beta.

> **NOTE:** macOS is required to build standalone iOS apps.

This guide describes an advanced feature of Expo. In most cases you can build standalone Expo apps using Expo's build services as described in the guide on [Building Standalone Apps](./building-standalone-apps).

If you prefer to not rely on our builders stability and you don't like waiting in the queue to get your standalone app build then you can build your Expo project on your own. The only thing you need is Turtle CLI. Turtle CLI is a command line interface for building Expo standalone apps. You can use it both on your CI and your private computer.


## Install Turtle CLI

### Prerequisites

You'll need to have these things installed:
- bash
- Node.js (version 8 or newer) - [download the latest version of Node.js](https://nodejs.org/en/).

#### For Android builds

- [Java Development Kit (version 8)](https://jdk.java.net/)
- gulp-cli (run `npm install -g gulp-cli` to get it)

#### For iOS builds

- macOS
- Xcode (version 9.4.1 or newer) - make sure you have run it at least once and you have agreed to the license agreements. Alternatively you can run `sudo xcodebuild -license`.
- fastlane - [see how to install it](https://docs.fastlane.tools/getting-started/ios/setup/#installing-fastlane)

### Turtle CLI

Install Turtle CLI by running:

```bash
$ npm install -g turtle-cli
```

Then run `turtle setup:ios` and/or `turtle setup:android` to verify everything is installed correctly. This step is optional and is also performed during the first run of the Turtle CLI. Please note that the Android setup command downloads, installs, and configures the appropriate versions of the Android SDK and NDK.

If you would like to make the first build even faster, you can supply the Expo SDK version to the setup command like so: `turtle setup:ios --sdk-version 30.0.0`. This tells Turtle CLI to download additional Expo-related dependencies for the given SDK version.

All Expo-related dependencies will be installed in a directory named `.turtle` within your home directory. This directory may be removed safely if you ever need to free up some disk space.


## Publish your project

In order to build your standalone Expo app, you first need to have successfully published your project. See the guide on [how to publish your project](../workflow/publishing) with Expo CLI or [how to host an app on your servers](./hosting-your-app).


## Start the build

In order to build a standalone app, you must have an Expo developer account and supply your credentials to Turtle. The recommended approach is to define two environment variables called `EXPO_USERNAME` and `EXPO_PASSWORD` with your credentials, though you may also pass these values to the build command from the command line. We recommending using the environment variables to help keep your credentials out of your terminal history or CI logs.

### Building for Android

Before starting the build, prepare the following things:

- Keystore
- Keystore alias
- Keystore password and key password

To learn how to generate those, see the guide on [Building Standalone Apps](./building-standalone-apps) first.

Set the `EXPO_ANDROID_KEYSTORE_PASSWORD` and `EXPO_ANDROID_KEY_PASSWORD` environment variables with the values of the keystore password and key password, respectively.

Then, start the standalone app build:
```bash
$ turtle build:android \\
  --keystore-path /path/to/your/keystore.jks \\
  --keystore-alias PUT_KEYSTORE_ALIAS_HERE
```

If the build finishes successfully you will find the path to the build artifact in the last line of the logs.

If you want to print the list of all available command arguments, please run `turtle build:android --help`.

### Building for iOS

Prepare the following unless you're building only for the iOS simulator:

- Apple Team ID - (a 10-character string like "Q2DBWS92CA")
- Distribution Certificate .p12 file *(+ password)*
- Push Notification Certificate .p12 file *(+ password)*
- Provisioning Profile

To learn how to generate those, see the guide on [Building Standalone Apps](./building-standalone-apps) first.

Set the `EXPO_IOS_DIST_P12_PASSWORD` and `EXPO_IOS_PUSH_P12_PASSWORD` environment variables with the values of the Distribution Certificate password and Push Notification Certificate password, respectively.

Then, start the standalone app build:
```bash
$ turtle build:ios \\
  --team-id YOUR_TEAM_ID \\
  --dist-p12-path /path/to/your/dist/cert.p12 \\
  --push-p12-path /path/to/your/push/cert.p12 \\
  --provisioning-profile-path /path/to/your/provisioning/profile.mobileprovision
```

If the build finishes successfully you will find the path to the build artifact in the last line of the logs.

If you want to print the list of all available command arguments, please run `turtle build:ios --help`.


## CI configuration file examples

See below for examples of how to use Turtle CLI with popular CI services (i.e. [CircleCI](#circleci) and [Travis CI](#travis-ci)). Both configuration files consist of two stages. In the first stage we publish the Expo project using the `expo publish` command (to see what that means, see [Publishing](https://docs.expo.io/versions/latest/workflow/publishing)). In the second stage we build application binaries for:
- Google Play Store - `.apk` file
- Apple App Store - `.ipa` file
- iOS simulator - in `.tar.gz` archive

In order to successfully reuse these configuration files, you have to set some environment variables first:
- common for all jobs
  * `EXPO_USERNAME` - your Expo account username
  * `EXPO_PASSWORD` - your Expo account password
- Android-specific. You can obtain these values from Expo servers by running `expo fetch:android:keystore` in your Expo project's directory.
  * `EXPO_ANDROID_KEYSTORE_BASE64` - **base64-encoded** Android keystore
  * `EXPO_ANDROID_KEYSTORE_ALIAS` - Android keystore alias
  * `EXPO_ANDROID_KEYSTORE_PASSWORD` - Android keystore password
  * `EXPO_ANDROID_KEY_PASSWORD` - Android key password
- iOS-specific. You can obtain these values from Expo servers by running `expo fetch:ios:certs` in your Expo project's directory.
  * `EXPO_APPLE_TEAM_ID` - Apple Team ID - (a 10-character string like "Q2DBWS92CA")
  * `EXPO_IOS_DIST_P12_BASE64` - **base64-encoded** iOS Distribution Certificate
  * `EXPO_IOS_DIST_P12_PASSWORD` - iOS Distribution Certificate password
  * `EXPO_IOS_PUSH_P12_BASE64` - **base64-encoded** iOS Push Notifications Certificate
  * `EXPO_IOS_PUSH_P12_PASSWORD` - iOS Push Notifications Certificate password
  * `EXPO_IOS_PROVISIONING_PROFILE_BASE64` - **base64-encoded** iOS Provisioning Profile

On macOS, you can base64-encode the contents of a file and copy the string to the clipboard by running `base64 some-file | pbcopy` in a terminal.

### CircleCI

- [See how to set environment variables.](https://circleci.com/docs/2.0/env-vars/#setting-an-environment-variable-in-a-project) You'll need to define all of the environment variables described above.
- The APK and IPA files are uploaded as build artifacts stored by CircleCI.

```yaml
version: 2.1

executors:
  js:
    docker:
      - image: circleci/node:8.12
    working_directory: ~/expo-project
    environment:
      YARN_CACHE_FOLDER: ~/yarn_cache

  android:
    # WARNING: medium (default) seems not to be enough for Turtle
    resource_class: xlarge
    docker:
      # It's just circleci/node:8.12 with openjdk-8-jdk installed
      - image: dsokal/expo-turtle-android
    working_directory: ~/expo-project
    environment:
      TURTLE_VERSION: 0.3.5
      PLATFORM: android
      YARN_CACHE_FOLDER: ~/yarn_cache

  ios:
    macos:
      xcode: 9.4.1
    working_directory: ~/expo-project
    environment:
      TURTLE_VERSION: 0.3.5
      PLATFORM: ios
      YARN_CACHE_FOLDER: /Users/distiller/yarn_cache
      HOMEBREW_NO_AUTO_UPDATE: 1

commands:
  install_macos_deps:
    steps:
      - run:
          name: Installing jq
          command: brew install jq

  determine_expo_sdk_version:
    steps:
      - run:
          name: Determine Expo SDK version for this project
          command: cat app.json | jq '.expo.sdkVersion' -r > /tmp/expo-sdk-version

  add_yarn_binaries_to_path:
    steps:
      - run:
          name: Add yarn binaries path to $PATH
          command: echo 'export PATH=~/.yarn/bin:$PATH' >> $BASH_ENV

  determine_turtle_cache_key_component:
    steps:
      - run:
          name: Determine Turtle cache key component
          command: echo $TURTLE_VERSION $PLATFORM > /tmp/turtle-version-platform

  restore_turtle_cache:
    steps:
      - restore_cache:
          keys:
          - cache-turtle-cli-{{ checksum "/tmp/turtle-version-platform" }}

  save_turtle_cache:
    steps:
      - save_cache:
          paths:
            - ~/.turtle
            - ~/yarn_cache
          key: cache-turtle-cli-{{ checksum "/tmp/turtle-version-platform" }}

  install_turtle_ios:
    steps:
      - run:
          name: Installing turtle-cli
          command: |
            yarn config set prefix ~/.yarn
            yarn global add turtle-cli@$TURTLE_VERSION

  setup_turtle:
    steps:
      - run:
          name: Setting up environment for Turtle
          command: turtle setup:$PLATFORM --sdk-version `cat /tmp/expo-sdk-version`

  restore_yarn_cache:
    steps:
      - restore_cache:
          keys:
          - cache-yarn-{{ checksum "package.json" }}

  save_yarn_cache:
    steps:
      - save_cache:
          paths:
            - ~/yarn_cache
          key: cache-yarn-{{ checksum "package.json" }}

workflows:
  version: 2
  builds:
    jobs:
      - publish_app:
          filters:
            branches:
              only: master
      - build_ios_simulator:
          requires:
            - publish_app
      - build_ios_archive:
          requires:
            - publish_app
      - build_android:
          requires:
            - publish_app

jobs:
  publish_app:
    executor: js
    steps:
      - checkout
      - add_yarn_binaries_to_path
      - restore_yarn_cache
      - run:
          name: Installing expo-cli
          command: yarn global add expo-cli
      - run:
          name: Publishing Expo app
          command: |
            expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD --non-interactive
            yarn
            expo publish
      - save_yarn_cache

  build_ios_archive:
    executor: ios
    steps:
      - checkout
      - install_macos_deps
      - determine_expo_sdk_version
      - add_yarn_binaries_to_path
      - determine_turtle_cache_key_component
      - restore_turtle_cache
      - install_turtle_ios
      - setup_turtle
      - save_turtle_cache
      - run:
          name: Building Expo standalone app
          command: |
            echo $EXPO_IOS_DIST_P12_BASE64 > expo-project_dist.p12.base64
            base64 --decode expo-project_dist.p12.base64 > expo-project_dist.p12
            echo $EXPO_IOS_PUSH_P12_BASE64 > expo-project_push.p12.base64
            base64 --decode expo-project_push.p12.base64 > expo-project_push.p12
            echo $EXPO_IOS_PROVISIONING_PROFILE_BASE64 > expo-project.mobileprovision.base64
            base64 --decode expo-project.mobileprovision.base64 > expo-project.mobileprovision
            turtle build:ios \\
              --team-id $EXPO_APPLE_TEAM_ID \\
              --dist-p12-path ./expo-project_dist.p12 \\
              --push-p12-path ./expo-project_push.p12 \\
              --provisioning-profile-path ./expo-project.mobileprovision \\
              -o ~/expo-project.ipa
      - store_artifacts:
          path: ~/expo-project.ipa

  build_ios_simulator:
    executor: ios
    steps:
      - checkout
      - install_macos_deps
      - determine_expo_sdk_version
      - add_yarn_binaries_to_path
      - determine_turtle_cache_key_component
      - restore_turtle_cache
      - install_turtle_ios
      - setup_turtle
      - save_turtle_cache
      - run:
          name: Building Expo standalone app
          command: |
            turtle build:ios \\
              --team-id $EXPO_APPLE_TEAM_ID \\
              --type simulator \\
              -o ~/expo-project.tar.gz
      - store_artifacts:
          path: ~/expo-project.tar.gz

  build_android:
    executor: android
    steps:
      - checkout
      - determine_expo_sdk_version
      - add_yarn_binaries_to_path
      - determine_turtle_cache_key_component
      - restore_turtle_cache
      - run:
          name: Installing gulp-cli & turtle-cli
          command: yarn global add gulp-cli turtle-cli@$TURTLE_VERSION
      - setup_turtle
      - save_turtle_cache
      - run:
          name: Building Expo standalone app
          command: |
            echo $EXPO_ANDROID_KEYSTORE_BASE64 > expo-project.jks.base64
            base64 --decode expo-project.jks.base64 > expo-project.jks
            turtle build:android \\
              --keystore-path ./expo-project.jks \\
              --keystore-alias $EXPO_ANDROID_KEYSTORE_ALIAS \\
              -o ~/expo-project.apk
      - store_artifacts:
          path: ~/expo-project.apk
```

### Travis CI

- [See how to set environment variables.](https://docs.travis-ci.com/user/environment-variables/) You'll need to define all of the environment variables described above.
- The APK and IPA files are build artifacts uploaded to your own AWS S3 bucket. You'll have to set additional environment variables:
  * `AWS_ACCESS_KEY_ID` - your AWS Access Key
  * `AWS_SECRET_ACCESS_KEY` - your AWS Secret Access Key
  * `AWS_BUCKET` - name of the bucket
  * `AWS_REGION` - region of the bucket

```yaml
language: node_js
node_js:
  - "8.12"
sudo: false

branches:
  only:
  - master

env:
  global:
    - EXPO_SDK_VERSION="30.0.0"
    - TURTLE_VERSION="0.3.5"
    - YARN_VERSION="1.10.1"

jobs:
  include:
    - stage: publish app
      env:
        - CACHE_NAME=publish YARN_CACHE_FOLDER="/home/travis/yarn_cache"
      cache:
        directories:
          - $HOME/yarn_cache
      before_install:
        - curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version $YARN_VERSION
        - export PATH="$HOME/.yarn/bin:$PATH"
      install:
        - yarn global add expo-cli
      script:
        - expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD --non-interactive
        - yarn
        - expo publish
    - stage: build standalone apps
      env:
        - CACHE_NAME=build-android YARN_CACHE_FOLDER="/home/travis/yarn_cache"
      cache:
        directories:
          - $HOME/.turtle
          - $HOME/yarn_cache
          - $HOME/.gradle/wrapper
      before_install:
        - curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version $YARN_VERSION
        - export PATH="$HOME/.yarn/bin:$PATH"
      install:
        - pip install --user awscli
        - yarn global add gulp-cli turtle-cli@$TURTLE_VERSION
      script:
        - export ARTIFACT_PATH="/home/travis/expo-project-$TRAVIS_COMMIT-`date +%s`.apk"
        - turtle setup:android --sdk-version $EXPO_SDK_VERSION || travis_terminate 1
        - echo $EXPO_ANDROID_KEYSTORE_BASE64 > expo-project.jks.base64
        - base64 --decode expo-project.jks.base64 > expo-project.jks
        - turtle build:android
            --keystore-path ./expo-project.jks
            --keystore-alias $EXPO_ANDROID_KEYSTORE_ALIAS
            -o $ARTIFACT_PATH
      after_success:
        - aws s3 cp $ARTIFACT_PATH s3://$AWS_BUCKET/`basename $ARTIFACT_PATH`
    - stage: build standalone apps
      os: osx
      osx_image: xcode9.4
      env:
        - CACHE_NAME=build-ios-simulator YARN_CACHE_FOLDER="/Users/travis/yarn_cache"
      cache:
        directories:
          - $HOME/.turtle
          - $HOME/yarn_cache
      before_install:
        - curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version $YARN_VERSION
        - export PATH="$HOME/.yarn/bin:$PATH"
      install:
        - pip install --user awscli
        - export PATH=/Users/travis/Library/Python/2.7/bin:$PATH
        - yarn global add turtle-cli@$TURTLE_VERSION
      script:
        - export ARTIFACT_PATH="/Users/travis/expo-project-$TRAVIS_COMMIT-`date +%s`.tar.gz"
        - turtle setup:ios --sdk-version $EXPO_SDK_VERSION || travis_terminate 1
        - turtle build:ios
            --team-id $EXPO_APPLE_TEAM_ID
            --type simulator
            -o $ARTIFACT_PATH
      after_success:
        - aws s3 cp $ARTIFACT_PATH s3://$AWS_BUCKET/`basename $ARTIFACT_PATH`
    - stage: build standalone apps
      os: osx
      osx_image: xcode9.4
      env:
        - CACHE_NAME=build-ios-ipa YARN_CACHE_FOLDER="/Users/travis/yarn_cache"
      cache:
        directories:
          - $HOME/.turtle
          - $HOME/yarn_cache
      before_install:
        - curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version $YARN_VERSION
        - export PATH="$HOME/.yarn/bin:$PATH"
      install:
        - pip install --user awscli
        - export PATH=/Users/travis/Library/Python/2.7/bin:$PATH
        - yarn global add turtle-cli@$TURTLE_VERSION
      script:
        - export ARTIFACT_PATH="/Users/travis/expo-project-$TRAVIS_COMMIT-`date +%s`.ipa"
        - turtle setup:ios --sdk-version $EXPO_SDK_VERSION || travis_terminate 1
        - echo $EXPO_IOS_DIST_P12_BASE64 > expo-project_dist.p12.base64
        - base64 --decode expo-project_dist.p12.base64 > expo-project_dist.p12
        - echo $EXPO_IOS_PUSH_P12_BASE64 > expo-project_push.p12.base64
        - base64 --decode expo-project_push.p12.base64 > expo-project_push.p12
        - echo $EXPO_IOS_PROVISIONING_PROFILE_BASE64 > expo-project.mobileprovision.base64
        - base64 --decode expo-project.mobileprovision.base64 > expo-project.mobileprovision
        - turtle build:ios
            --team-id $EXPO_APPLE_TEAM_ID
            --dist-p12-path ./expo-project_dist.p12
            --push-p12-path ./expo-project_push.p12
            --provisioning-profile-path ./expo-project.mobileprovision
            -o $ARTIFACT_PATH
      after_success:
        - aws s3 cp $ARTIFACT_PATH s3://$AWS_BUCKET/`basename $ARTIFACT_PATH`
```
