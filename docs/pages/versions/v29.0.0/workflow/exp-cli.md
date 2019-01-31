---
title: exp Command-Line Interface
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

In addition to XDE we also have a CLI `exp` if you prefer to work on the command line or want to use Expo in tests or continuous integration (CI).

## Installation

Run `npm install -g exp` to install `exp` globally.

If you haven't used `exp` or XDE before, the first thing you'll need to do is login with your Expo account using `exp login`.

## Commands

View the list of commands using `exp --help`:

```
Usage: exp [options] [command]


Options:

  -V, --version          output the version number
  -o, --output [format]  Output format. pretty (default), raw
  -h, --help             output usage information


Commands:

  android [options] [project-dir]                 Opens your app in Expo on a connected Android device
  build:ios|bi [options] [project-dir]            Build a standalone IPA for your project, signed and ready for submission to the Apple App Store.
  build:android|ba [options] [project-dir]        Build a standalone APK for your project, signed and ready for submission to the Google Play Store.
  build:status|bs [options] [project-dir]         Gets the status of a current (or most recently finished) build for your project.
  convert|onentize [options] [project-dir]        Initialize Expo project files within an existing React Native project
  detach [options] [project-dir]                  Creates Xcode and Android Studio projects for your app. Use this if you need to add custom native functionality.
  diagnostics [options] [project-dir]             Uploads diagnostics information and returns a url to share with the Expo team.
  doctor [options] [project-dir]                  Diagnoses issues with your Expo project.
  fetch:ios:certs [options] [project-dir]         Fetch this project's iOS certificates. Writes to PROJECT_DIR/PROJECT_NAME_(dist|push).p12 and prints passwords to stdout.
  fetch:android:keystore [options] [project-dir]  Fetch this project's Android keystore. Writes keystore to PROJECT_DIR/PROJECT_NAME.jks and prints passwords to stdout.
  init|i [options] [project-dir]                  Initializes a directory with an example project. Run it without any options and you will be prompted for the name and type.
  install:ios [options]                           Install the latest version of Expo Client for iOS on the simulator
  install:android [options]                       Install the latest version of Expo Client for Android on a connected device or emulator
  ios [options] [project-dir]                     Opens your app in Expo in an iOS simulator on your computer
  login|signin [options]                          Login to Expo
  logout [options]                                Logout from exp.host
  path [options]                                  Sets PATH for XDE
  prepare-detached-build [options] [project-dir]  Prepares a detached project for building
  publish:history|ph [options] [project-dir]      View a log of your published releases.
  publish:details|pd [options] [project-dir]      View the details of a published release.
  publish:set|ps [options] [project-dir]          Set a published release to be served from a specified channel.
  publish:rollback|pr [options] [project-dir]     Rollback an update to a channel.
  publish|p [options] [project-dir]               Publishes your project to exp.host
  register [options]                              Sign up for a new Expo account
  send [options] [project-dir]                    Sends a link to your project to a phone number or e-mail address
  start|r [options] [project-dir]                 Starts or restarts a local server for your app and gives you a URL to it
  url|u [options] [project-dir]                   Displays the URL you can use to view your project in Expo
  whoami|w [options]                              Checks with the server and then says who you are logged in as
```

View additional information about a specific command by passing the `--help` flag. For example, `exp start --help` outputs:

```
Usage: start|r [options] [project-dir]

Starts or restarts a local server for your app and gives you a URL to it


Options:

  -s, --send-to [dest]   A phone number or e-mail address to send a link to
  -c, --clear            Clear the React Native packager cache
  -a, --android          Opens your app in Expo on a connected Android device
  -i, --ios              Opens your app in Expo in a currently running iOS simulator on your computer
  -m, --host [mode]      tunnel (default), lan, localhost. Type of host to use. "tunnel" allows you to view your link on other networks
  -p, --protocol [mode]  exp (default), http, redirect. Type of protocol. "exp" is recommended right now
  --tunnel               Same as --host tunnel
  --lan                  Same as --host lan
  --localhost            Same as --host localhost
  --dev                  Turns dev flag on
  --no-dev               Turns dev flag off
  --minify               Turns minify flag on
  --no-minify            Turns minify flag off
  --non-interactive      Fails if an interactive prompt would be required to continue.
  --offline              Allows this command to run while offline
  -h, --help             output usage information
```

Additionally, you can run in offline mode by passing the `--offline` flag to the `android`, `ios`, or `start` commands.
