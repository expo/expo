---
title: Expo CLI
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Expo CLI is a command line interface for developing Expo apps. It also includes a web-based inteface (Expo Dev Tools) for using some of the most often used features also from a quick to use graphical interface.

## Installation

See [Installation](../../introduction/installation).

## Commands

View the list of commands using `expo --help`:

```
Usage: expo [options] [command]

Options:

  -V, --version                                   output the version number
  -o, --output [format]                           Output format. pretty (default), raw
  --non-interactive                               Fail, if an interactive prompt would be required to continue. Enabled by default if stdin is not a TTY.
  -h, --help                                      output usage information

Commands:

  android [options] [project-dir]                 Opens your app in Expo on a connected Android device
  build:ios|bi [options] [project-dir]            Build a standalone IPA for your project, signed and ready for submission to the Apple App Store.
  build:android|ba [options] [project-dir]        Build a standalone APK for your project, signed and ready for submission to the Google Play Store.
  build:status|bs [options] [project-dir]         Gets the status of a current (or most recently finished) build for your project.
  bundle-assets [options] [project-dir]           Bundles assets for a detached app. This command should be exectuted from xcode or gradle.
  diagnostics [options] [project-dir]             Uploads diagnostics information and returns a url to share with the Expo team.
  doctor [options] [project-dir]                  Diagnoses issues with your Expo project.
  eject [options] [project-dir]                   Creates Xcode and Android Studio projects for your app. Use this if you need to add custom native functionality.
  fetch:ios:certs [options] [project-dir]         Fetch this project's iOS certificates and provisioning profile. Writes certificates to PROJECT_DIR/PROJECT_NAME_(dist|push).p12 and prints passwords to stdout.
  fetch:android:keystore [options] [project-dir]  Fetch this project's Android keystore. Writes keystore to PROJECT_DIR/PROJECT_NAME.jks and prints passwords to stdout.
  fetch:android:hashes [options] [project-dir]    Fetch this project's Android key hashes needed to setup Google/Facebook authentication.
  generate-module [options] [project-dir]         Create new universal module for Expo.
  init|i [options] [project-dir]                  Initializes a directory with an example project. Run it without any options and you will be prompted for the name and type.
  install:ios [options]                           Install the latest version of Expo Client for iOS on the simulator
  install:android [options]                       Install the latest version of Expo Client for Android on a connected device or emulator
  ios [options] [project-dir]                     Opens your app in Expo in an iOS simulator on your computer
  login|signin [options]                          Login with your Expo account
  logout [options]                                Logout from your Expo account
  prepare-detached-build [options] [project-dir]  Prepares a detached project for building
  publish:history|ph [options] [project-dir]      View a log of your published releases.
  publish:details|pd [options] [project-dir]      View the details of a published release.
  publish:set|ps [options] [project-dir]          Set a published release to be served from a specified channel.
  publish:rollback|pr [options] [project-dir]     Rollback an update to a channel.
  publish|p [options] [project-dir]               Publishes your project to exp.host
  push:android:upload [options] [project-dir]     Uploads a Firebase Cloud Messaging key for Android push notifications.
  push:android:show [options] [project-dir]       Print the value currently in use for FCM notifications for this project.
  push:android:clear [options] [project-dir]      Deletes a previously uploaded FCM credential.
  register [options]                              Sign up for a new Expo account
  send [options] [project-dir]                    Sends a link to your project to a phone number or e-mail address
  start|r [options] [project-dir]                 Starts or restarts a local server for your app and gives you a URL to it
  url|u [options] [project-dir]                   Displays the URL you can use to view your project in Expo
  url:ipa [options] [project-dir]                 Displays the standalone iOS binary URL you can use to download your app binary
  url:apk [options] [project-dir]                 Displays the standalone Android binary URL you can use to download your app binary
  webhooks:set [options] [project-dir]            Set a webhook for the project.
  webhooks:show [options] [project-dir]           Show webhooks for the project.
  webhooks:clear [options] [project-dir]          Clear a webhook associated with this project.
  whoami|w [options]                              Checks with the server and then says who you are logged in as
```
