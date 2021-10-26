---
title: Expo CLI
maxHeadingDepth: 4
---

import TerminalBlock from '~/components/plugins/TerminalBlock';

Expo CLI is a command line app that is the main interface between a developer and Expo tools. You'll use it for a variety of tasks, such as:

- Creating new projects
- Developing your app: running the project server, viewing logs, opening your app in a simulator
- [Publishing](publishing.md) your app JavaScript and other assets and managing releasing them as updates
- [Building binaries](../distribution/building-standalone-apps.md) (`apk` and `ipa` files) to be [uploaded to the App Store and Play Store](../distribution/uploading-apps.md)
- Managing Apple Credentials and Google Keystores

You may use the CLI in your terminal or use the web based interface (it opens automatically by default, or you can press d from the CLI to open it on demand). The web interface enables you to use some of the most often used features from a quick-to-use graphical interface. We’ve only scratched the surface of what expo-cli can do so far. Be sure to check out all the possible commands below!

## Installation

<TerminalBlock cmd={['npm install -g expo-cli']} />

## Checking CLI Version

Run `expo --version` to determine what version you are currently working with.

## Commands

The commands listed below are derived from the latest version of Expo CLI. You can view the list of commands available with your version in your terminal using `expo --help`. To learn more about a specific command and its options use `expo [command] --help`.

<TerminalBlock cmd={[`# Usage: expo [command] [options]`]} />

<!--
Generation script can be found https://github.com/expo/expo-cli/blob/master/packages/expo-cli/scripts/introspect.ts
Run `yarn introspect md` in expo-cli/packages/expo-cli then paste the results below.
 -->

<!-- BEGIN GENERATED BLOCK. DO NOT MODIFY MANUALLY. https://github.com/expo/expo-cli/blob/master/packages/expo-cli/scripts/introspect.ts -->

> Based on `expo-cli` v4.11.0

---

### Core

<details>
<summary>
<h4>expo export</h4>
<p>Export the static files of the app for hosting it on a web server</p>
</summary>
<p>

| Option                        | Description                                                            |
| ----------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `--platform [all⎮android      | ios]`                                                                  | Platforms: android, ios, all |
| `-p, --public-url [url]`      | The public url that will host the static files (required)              |
| `-c, --clear`                 | Clear the Metro bundler cache                                          |
| `--output-dir [dir]`          | The directory to export the static files to                            |
| `-a, --asset-url [url]`       | The absolute or relative url that will host the asset files            |
| `-d, --dump-assetmap`         | Dump the asset map for further processing                              |
| `--dev`                       | Configure static files for developing locally using a non-https server |
| `-s, --dump-sourcemap`        | Dump the source map for debugging the JS bundle                        |
| `-q, --quiet`                 | Suppress verbose output                                                |
| `-t, --target [managed⎮bare]` | Target environment for which this export is intended                   |
| `--merge-src-dir [dir]`       | A repeatable source dir to merge in                                    |
| `--merge-src-url [url]`       | A repeatable source tar.gz file URL to merge in                        |
| `--max-workers [num]`         | Maximum number of tasks to allow Metro to spawn                        |
| `--experimental-bundle`       | export bundles for use with EAS updates                                |
| `--config [file]`             | Deprecated: Use app.config.js to switch config files instead.          |

</p>
</details>

<details>
<summary>
<h4>expo init</h4>
<p>Create a new Expo project</p>
</summary>
<p>

Alias: `expo i`

| Option                  | Description                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-t, --template [name]` | Specify which template to use. Valid options are "blank", "tabs", "bare-minimum" or a package on npm (e.g. "expo-template-bare-minimum") that includes an Expo project template. |
| `--npm`                 | Use npm to install dependencies. (default when Yarn is not installed)                                                                                                            |
| `--yarn`                | Use Yarn to install dependencies. (default when Yarn is installed)                                                                                                               |
| `--no-install`          | Skip installing npm packages or CocoaPods.                                                                                                                                       |
| `--name [name]`         | The name of your app visible on the home screen.                                                                                                                                 |
| `--yes`                 | Use default options. Same as "expo init . --template blank                                                                                                                       |

</p>
</details>

<details>
<summary>
<h4>expo install</h4>
<p>Install a unimodule or other package to a project</p>
</summary>
<p>

Alias: `expo add`

| Option   | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| `--npm`  | Use npm to install dependencies. (default when package-lock.json exists) |
| `--yarn` | Use Yarn to install dependencies. (default when yarn.lock exists)        |

</p>
</details>

<details>
<summary>
<h4>expo publish</h4>
<p>Deploy a project to Expo hosting</p>
</summary>
<p>

Alias: `expo p`

| Option                        | Description                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `-q, --quiet`                 | Suppress verbose output from the Metro bundler.                                         |
| `-s, --send-to [dest]`        | A phone number or email address to send a link to                                       |
| `-c, --clear`                 | Clear the Metro bundler cache                                                           |
| `-t, --target [managed⎮bare]` | Target environment for which this publish is intended. Options are `managed` or `bare`. |
| `--max-workers [num]`         | Maximum number of tasks to allow Metro to spawn.                                        |
| `--release-channel [name]`    | The release channel to publish to. Default is 'default'.                                |
| `--config [file]`             | Deprecated: Use app.config.js to switch config files instead.                           |

</p>
</details>

<details>
<summary>
<h4>expo run:android</h4>
<p>Run the Android app binary locally</p>
</summary>
<p>

| Option                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `--no-bundler`          | Skip starting the Metro bundler                               |
| `-d, --device [device]` | Device name to build the app on                               |
| `-p, --port [port]`     | Port to start the Metro bundler on. Default: 8081             |
| `--variant [name]`      | (Android) build variant                                       |
| `--config [file]`       | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo run:ios</h4>
<p>Run the iOS app binary locally</p>
</summary>
<p>

| Option                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `--no-bundler`                    | Skip starting the Metro bundler                               |
| `-d, --device [device]`           | Device name or UDID to build the app on                       |
| `-p, --port [port]`               | Port to start the Metro bundler on. Default: 8081             |
| `--scheme [scheme]`               | Scheme to build                                               |
| `--configuration [configuration]` | Xcode configuration to use. Debug or Release. Default: Debug  |
| `--config [file]`                 | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo send</h4>
<p>Share the project's URL to an email address</p>
</summary>
<p>

| Option                 | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `-s, --send-to [dest]` | Email address to send the URL to                                                                               |
| `--dev-client`         | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`    | Custom URI protocol to use with a dev client                                                                   |
| `-a, --android`        | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`            | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`            | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`    | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`             | Same as --host tunnel                                                                                          |
| `--lan`                | Same as --host lan                                                                                             |
| `--localhost`          | Same as --host localhost                                                                                       |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                                  |

</p>
</details>

<details>
<summary>
<h4>expo start</h4>
<p>Start a local dev server for the app</p>
</summary>
<p>

Alias: `expo r`

| Option                 | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `-s, --send-to [dest]` | An email address to send a link to                                                                             |
| `-c, --clear`          | Clear the Metro bundler cache                                                                                  |
| `--max-workers [num]`  | Maximum number of tasks to allow Metro to spawn.                                                               |
| `--dev`                | Turn development mode on                                                                                       |
| `--no-dev`             | Turn development mode off                                                                                      |
| `--minify`             | Minify code                                                                                                    |
| `--no-minify`          | Do not minify code                                                                                             |
| `--https`              | To start webpack with https protocol                                                                           |
| `-p, --port [port]`    | Port to start the native Metro bundler on (does not apply to web or tunnel). Default: 19000                    |
| `--no-https`           | To start webpack with http protocol                                                                            |
| `--dev-client`         | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`    | Custom URI protocol to use with a dev client                                                                   |
| `-a, --android`        | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`            | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`            | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`    | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`             | Same as --host tunnel                                                                                          |
| `--lan`                | Same as --host lan                                                                                             |
| `--localhost`          | Same as --host localhost                                                                                       |
| `--offline`            | Allows this command to run while offline                                                                       |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                                  |

</p>
</details>

<details>
<summary>
<h4>expo start:web</h4>
<p>Start a Webpack dev server for the web app</p>
</summary>
<p>

Alias: `expo web`

| Option                 | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--dev`                | Turn development mode on                                                                                       |
| `--no-dev`             | Turn development mode off                                                                                      |
| `--minify`             | Minify code                                                                                                    |
| `--no-minify`          | Do not minify code                                                                                             |
| `--https`              | To start webpack with https protocol                                                                           |
| `--no-https`           | To start webpack with http protocol                                                                            |
| `-p, --port [port]`    | Port to start the Webpack bundler on. Default: 19006                                                           |
| `-s, --send-to [dest]` | An email address to send a link to                                                                             |
| `--dev-client`         | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`    | Custom URI protocol to use with a dev client                                                                   |
| `-a, --android`        | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`            | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`            | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`    | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`             | Same as --host tunnel                                                                                          |
| `--lan`                | Same as --host lan                                                                                             |
| `--localhost`          | Same as --host localhost                                                                                       |
| `--offline`            | Allows this command to run while offline                                                                       |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                                  |

</p>
</details>

---

### Auth

<details>
<summary>
<h4>expo login</h4>
<p>Login to an Expo account</p>
</summary>
<p>

Alias: `expo signin`

| Option                    | Description                            |
| ------------------------- | -------------------------------------- |
| `-u, --username [string]` | Username                               |
| `-p, --password [string]` | Password                               |
| `--otp [string]`          | One-time password from your 2FA device |

</p>
</details>

<details>
<summary>
<h4>expo logout</h4>
<p>Logout of an Expo account</p>
</summary>
<p>

This command does not take any options.

</p>
</details>

<details>
<summary>
<h4>expo register</h4>
<p>Sign up for a new Expo account</p>
</summary>
<p>

This command does not take any options.

</p>
</details>

<details>
<summary>
<h4>expo whoami</h4>
<p>Return the currently authenticated account</p>
</summary>
<p>

Alias: `expo w`

This command does not take any options.

</p>
</details>

---

### Client

<details>
<summary>
<h4>expo client:install:ios</h4>
<p>Install Expo Go for iOS on the simulator</p>
</summary>
<p>

| Option     | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `--latest` | Install the latest version of Expo Go, ignoring the current project version. |

</p>
</details>

<details>
<summary>
<h4>expo client:install:android</h4>
<p>Install Expo Go for Android on a connected device or emulator</p>
</summary>
<p>

| Option                  | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `-d, --device [device]` | Device name to install the client on                                       |
| `--latest`              | Install the latest version of Expo Go, ignore the current project version. |

</p>
</details>

---

### Info

<details>
<summary>
<h4>expo config</h4>
<p>Show the project config</p>
</summary>
<p>

| Option                       | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- | ----------------------- |
| `-t, --type [public⎮prebuild | introspect]`                                                  | Type of config to show. |
| `--full`                     | Include all project config data                               |
| `--config [file]`            | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo diagnostics</h4>
<p>Log environment info to the console</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo doctor</h4>
<p>Diagnose issues with the project</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo upgrade</h4>
<p>Upgrade the project packages and config for the given SDK version</p>
</summary>
<p>

Alias: `expo update`

| Option   | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| `--npm`  | Use npm to install dependencies. (default when package-lock.json exists) |
| `--yarn` | Use Yarn to install dependencies. (default when yarn.lock exists)        |

</p>
</details>

---

### Publish

<details>
<summary>
<h4>expo publish:set</h4>
<p>Specify the channel to serve a published release</p>
</summary>
<p>

Alias: `expo ps`

| Option                          | Description                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| `-c, --release-channel [name]`  | The channel to set the published release. (Required)                  |
| `-p, --publish-id [publish-id]` | The id of the published release to serve from the channel. (Required) |
| `--config [file]`               | Deprecated: Use app.config.js to switch config files instead.         |

</p>
</details>

<details>
<summary>
<h4>expo publish:rollback</h4>
<p>Undo an update to a channel</p>
</summary>
<p>

Alias: `expo pr`

| Option                         | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `--channel-id [channel-id]`    | This flag is deprecated.                                      |
| `-c, --release-channel [name]` | The channel to rollback from. (Required)                      |
| `-s, --sdk-version [version]`  | The sdk version to rollback. (Required)                       |
| `-p, --platform [android⎮ios]` | The platform to rollback.                                     |
| `--config [file]`              | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo publish:history</h4>
<p>Log the project's releases</p>
</summary>
<p>

Alias: `expo ph`

| Option                         | Description                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `-c, --release-channel [name]` | Filter by release channel. If this flag is not included, the most recent publications will be shown. |
| `--count [number-of-logs]`     | Number of logs to view, maximum 100, default 5.                                                      |
| `-p, --platform [android⎮ios]` | Filter by platform, android or ios. Defaults to both platforms.                                      |
| `-s, --sdk-version [version]`  | Filter by SDK version e.g. 35.0.0                                                                    |
| `-r, --raw`                    | Produce some raw output.                                                                             |
| `--config [file]`              | Deprecated: Use app.config.js to switch config files instead.                                        |

</p>
</details>

<details>
<summary>
<h4>expo publish:details</h4>
<p>Log details of a published release</p>
</summary>
<p>

Alias: `expo pd`

| Option                      | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `--publish-id [publish-id]` | Publication id. (Required)                                    |
| `-r, --raw`                 | Produce some raw output.                                      |
| `--config [file]`           | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

---

### Build

<details>
<summary>
<h4>expo build:ios</h4>
<p>Build and sign a standalone IPA for the Apple App Store</p>
</summary>
<p>

Alias: `expo bi`

| Option                               | Description                                                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `-c, --clear-credentials`            | Clear all credentials stored on Expo servers.                                                                       |
| `--clear-dist-cert`                  | Remove Distribution Certificate stored on Expo servers.                                                             |
| `--clear-push-key`                   | Remove Push Notifications Key stored on Expo servers.                                                               |
| `--clear-push-cert`                  | Remove Push Notifications Certificate stored on Expo servers. Use of Push Notifications Certificates is deprecated. |
| `--clear-provisioning-profile`       | Remove Provisioning Profile stored on Expo servers.                                                                 |
| `-r --revoke-credentials`            | Revoke credentials on developer.apple.com, select appropriate using --clear-\* options.                             |
| `--apple-id [login]`                 | Apple ID username (please also set the Apple ID password as EXPO_APPLE_PASSWORD environment variable).              |
| `-t --type [archive⎮simulator]`      | Type of build: [archive⎮simulator].                                                                                 |
| `--release-channel [name]`           | Pull from specified release channel.                                                                                |
| `--no-publish`                       | Disable automatic publishing before building.                                                                       |
| `--no-wait`                          | Exit immediately after scheduling build.                                                                            |
| `--team-id [apple-teamId]`           | Apple Team ID.                                                                                                      |
| `--dist-p12-path [path]`             | Path to your Distribution Certificate P12 (set password as EXPO_IOS_DIST_P12_PASSWORD environment variable).        |
| `--push-id [push-id]`                | Push Key ID (ex: 123AB4C56D).                                                                                       |
| `--push-p8-path [path]`              | Path to your Push Key .p8 file.                                                                                     |
| `--provisioning-profile-path [path]` | Path to your Provisioning Profile.                                                                                  |
| `--public-url [url]`                 | The URL of an externally hosted manifest (for self-hosted apps).                                                    |
| `--skip-credentials-check`           | Skip checking credentials.                                                                                          |
| `--skip-workflow-check`              | Skip warning about build service bare workflow limitations.                                                         |
| `--config [file]`                    | Deprecated: Use app.config.js to switch config files instead.                                                       |

</p>
</details>

<details>
<summary>
<h4>expo build:android</h4>
<p>Build and sign a standalone APK or App Bundle for the Google Play Store</p>
</summary>
<p>

Alias: `expo ba`

| Option                       | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| `-c, --clear-credentials`    | Clear stored credentials.                                       |
| `--release-channel [name]`   | Pull from specified release channel.                            |
| `--no-publish`               | Disable automatic publishing before building.                   |
| `--no-wait`                  | Exit immediately after triggering build.                        |
| `--keystore-path [path]`     | Path to your Keystore: \*.jks.                                  |
| `--keystore-alias [alias]`   | Keystore Alias                                                  |
| `--generate-keystore`        | [deprecated] Generate Keystore if one does not exist            |
| `--public-url [url]`         | The URL of an externally hosted manifest (for self-hosted apps) |
| `--skip-workflow-check`      | Skip warning about build service bare workflow limitations.     |
| `-t --type [app-bundle⎮apk]` | Type of build: [app-bundle⎮apk].                                |
| `--config [file]`            | Deprecated: Use app.config.js to switch config files instead.   |

</p>
</details>

<details>
<summary>
<h4>expo build:web</h4>
<p>Build the web app for production</p>
</summary>
<p>

| Option            | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `-c, --clear`     | Clear all cached build files and assets.                                                       |
| `--no-pwa`        | Prevent webpack from generating the manifest.json and injecting meta into the index.html head. |
| `-d, --dev`       | Turns dev flag on before bundling                                                              |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead.                                  |

</p>
</details>

<details>
<summary>
<h4>expo build:status</h4>
<p>Get the status of the latest build for the project</p>
</summary>
<p>

Alias: `expo bs`

| Option               | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps). |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.    |

</p>
</details>

---

### Credentials

<details>
<summary>
<h4>expo credentials:manager</h4>
<p>Manage your credentials</p>
</summary>
<p>

| Option                        | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `-p --platform [android⎮ios]` | Platform: [android⎮ios]                                       |
| `--config [file]`             | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo fetch:ios:certs</h4>
<p>Download the project's iOS standalone app signing credentials</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo fetch:android:keystore</h4>
<p>Download the project's Android keystore</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo fetch:android:hashes</h4>
<p>Compute and log the project's Android key hashes</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo fetch:android:upload-cert</h4>
<p>Download the project's Android keystore</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

---

### Notifications

<details>
<summary>
<h4>expo push:android:upload</h4>
<p>Upload an FCM key for Android push notifications</p>
</summary>
<p>

| Option                | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `--api-key [api-key]` | Server API key for FCM.                                       |
| `--config [file]`     | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo push:android:show</h4>
<p>Log the value currently in use for FCM notifications for this project</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo push:android:clear</h4>
<p>Delete a previously uploaded FCM credential</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

---

### Url

<details>
<summary>
<h4>expo url</h4>
<p>Log a URL for opening the project in Expo Go</p>
</summary>
<p>

Alias: `expo u`

| Option              | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--dev-client`      | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]` | Custom URI protocol to use with a dev client                                                                   |
| `-a, --android`     | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`         | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`         | Opens your app in a web browser                                                                                |
| `-m, --host [mode]` | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`          | Same as --host tunnel                                                                                          |
| `--lan`             | Same as --host lan                                                                                             |
| `--localhost`       | Same as --host localhost                                                                                       |
| `--offline`         | Allows this command to run while offline                                                                       |
| `--config [file]`   | Deprecated: Use app.config.js to switch config files instead.                                                  |

</p>
</details>

<details>
<summary>
<h4>expo url:ipa</h4>
<p>Log the download URL for the standalone iOS binary</p>
</summary>
<p>

| Option               | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps) |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.   |

</p>
</details>

<details>
<summary>
<h4>expo url:apk</h4>
<p>Log the download URL for the standalone Android binary</p>
</summary>
<p>

| Option               | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps) |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.   |

</p>
</details>

---

### Webhooks

<details>
<summary>
<h4>expo webhooks</h4>
<p>List all webhooks for a project</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo webhooks:add</h4>
<p>Add a webhook to a project</p>
</summary>
<p>

| Option                 | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `--url [url]`          | URL to request. (Required)                                                                              |
| `--event [event-type]` | Event type that triggers the webhook. [build] (Required)                                                |
| `--secret [secret]`    | Secret used to create a hash signature of the request payload, provided in the 'Expo-Signature' header. |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                           |

</p>
</details>

<details>
<summary>
<h4>expo webhooks:remove</h4>
<p>Delete a webhook</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--id [id]`       | ID of the webhook to remove.                                  |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo webhooks:update</h4>
<p>Update an existing webhook</p>
</summary>
<p>

| Option                 | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `--id [id]`            | ID of the webhook to update.                                                                            |
| `--url [url]`          | URL the webhook will request.                                                                           |
| `--event [event-type]` | Event type that triggers the webhook. [build]                                                           |
| `--secret [secret]`    | Secret used to create a hash signature of the request payload, provided in the 'Expo-Signature' header. |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                           |

</p>
</details>

---

### Upload

<details>
<summary>
<h4>expo upload:android</h4>
<p>Upload an Android binary to the Google Play Store</p>
</summary>
<p>

Alias: `expo ua`

| Option                                | Description                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--latest`                            | upload the latest build                                                                                      |
| `--id [id]`                           | id of the build to upload                                                                                    |
| `--path [path]`                       | path to the .apk/.aab file                                                                                   |
| `--url [url]`                         | app archive url                                                                                              |
| `--key [key]`                         | path to the JSON key used to authenticate with Google Play                                                   |
| `--android-package [android-package]` | Android package name (using expo.android.package from app.json by default)                                   |
| `--type [archive-type]`               | archive type: apk, aab                                                                                       |
| `--track [track]`                     | the track of the application to use, choose from: production, beta, alpha, internal, rollout                 |
| `--release-status [release-status]`   | release status (used when uploading new apks/aabs), choose from: completed, draft, halted, inProgress        |
| `--use-submission-service`            | Experimental: Use Submission Service for uploading your app. The upload process will happen on Expo servers. |
| `--verbose`                           | Always print logs from Submission Service                                                                    |
| `--config [file]`                     | Deprecated: Use app.config.js to switch config files instead.                                                |

</p>
</details>

<details>
<summary>
<h4>expo upload:ios</h4>
<p>Unsupported: Use eas submit or Transporter app instead.</p>
</summary>
<p>

Alias: `expo ui`

| Option                                    | Description                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--latest`                                | upload the latest build (default)                                                                                                   |
| `--id [id]`                               | id of the build to upload                                                                                                           |
| `--path [path]`                           | path to the .ipa file                                                                                                               |
| `--url [url]`                             | app archive url                                                                                                                     |
| `--apple-id [apple-id]`                   | your Apple ID username (you can also set EXPO_APPLE_ID env variable)                                                                |
| `--itc-team-id [itc-team-id]`             | App Store Connect Team ID - this option is deprecated, the proper ID is resolved automatically                                      |
| `--apple-id-password [apple-id-password]` | your Apple ID password (you can also set EXPO_APPLE_PASSWORD env variable)                                                          |
| `--app-name [app-name]`                   | the name of your app as it will appear on the App Store, this can't be longer than 30 characters (default: expo.name from app.json) |
| `--company-name [company-name]`           | the name of your company, needed only for the first upload of any app to App Store                                                  |
| `--sku [sku]`                             | a unique ID for your app that is not visible on the App Store, will be generated unless provided                                    |
| `--language [language]`                   | primary language (e.g. English, German; run `expo upload:ios --help` to see the list of available languages)                        |
| `--public-url [url]`                      | The URL of an externally hosted manifest (for self-hosted apps)                                                                     |
| `--config [file]`                         | Deprecated: Use app.config.js to switch config files instead.                                                                       |

</p>
</details>

---

### Eject

<details>
<summary>
<h4>expo customize:web</h4>
<p>Eject the default web files for customization</p>
</summary>
<p>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `-f, --force`     | Allows replacing existing files                               |
| `--offline`       | Allows this command to run while offline                      |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</p>
</details>

<details>
<summary>
<h4>expo eject</h4>
<p>Create native iOS and Android project files. Learn more: https://docs.expo.dev/workflow/customizing/</p>
</summary>
<p>

| Option                       | Description                                                           |
| ---------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| `--no-install`               | Skip installing npm packages and CocoaPods.                           |
| `--npm`                      | Use npm to install dependencies. (default when Yarn is not installed) |
| `-p, --platform [all⎮android | ios]`                                                                 | Platforms to sync: ios, android, all. Default: all |
| `--config [file]`            | Deprecated: Use app.config.js to switch config files instead.         |

</p>
</details>

<details>
<summary>
<h4>expo prebuild</h4>
<p>Experimental: Create native iOS and Android project files before building natively. Learn more: https://docs.expo.dev/workflow/customizing/</p>
</summary>
<p>

| Option                                    | Description                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `--no-install`                            | Skip installing npm packages and CocoaPods.                                             |
| `--clean`                                 | Delete the native folders and regenerate them before applying changes                   |
| `--npm`                                   | Use npm to install dependencies. (default when Yarn is not installed)                   |
| `--template [template]`                   | Project template to clone from. File path pointing to a local tar file or a github repo |
| `-p, --platform [all⎮android              | ios]`                                                                                   | Platforms to sync: ios, android, all. Default: all |
| `--skip-dependency-update [dependencies]` | Preserves versions of listed packages in package.json (comma separated list)            |
| `--config [file]`                         | Deprecated: Use app.config.js to switch config files instead.                           |

</p>
</details>

---

### Experimental

<details>
<summary>
<h4>expo client:ios</h4>
<p>Experimental: build a custom version of Expo Go for iOS using your own Apple credentials</p>
</summary>
<p>

| Option               | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `--apple-id [login]` | Apple ID username (please also set the Apple ID password as EXPO_APPLE_PASSWORD environment variable). |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.                                          |

</p>
</details>

<!-- END GENERATED BLOCK. DO NOT MODIFY MANUALLY. -->
