---
title: Global Expo CLI
maxHeadingDepth: 4
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

The global Expo CLI `expo-cli` was succeeded by the local CLI `@expo/cli` in SDK 46. This documentation contains info on the now deprecated `expo-cli` package.

If you're using a project that is SDK 46 or higher, refer to the [Expo CLI docs](/workflow/expo-cli/).

## Installation

The legacy Expo CLI can be installed as a global npm package on your development machine. To download and install it, run the following command:

<Terminal cmd={['$ npm install -g expo-cli']} />

Not versioning the CLI with your project lowers backwards compatibility, and makes it harder to use your project in continuous environments like GitHub Actions. To combat this, we moved to using a versioned CLI in SDK 46.

## Checking CLI Version

To check the current version of the global Expo CLI you are using, use the `--version` option.

<Terminal cmd={['$ expo --version']} />

## Commands

You can view the list of commands available with your version in your terminal using the `--help` option.

<Terminal cmd={['$ expo --help']} />

To learn more about a specific command and the options it may have, use `expo [command] --help`.

<Terminal cmd={[`# Usage: expo [command] [options]`]} />

You will find a list of all commands derived from the latest version of Expo CLI.

{/* BEGIN GENERATED BLOCK. DO NOT MODIFY MANUALLY. https://github.com/expo/expo-cli/blob/main/packages/expo-cli/scripts/introspect.ts */}

> Based on `expo-cli` v5.2.0

---

### Core

<Collapsible summary={<><h4>expo export</h4>Export the static files of the app for hosting it on a web server</>}>

| Option                           | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `--platform [all\|android\|ios]` | Platforms: android, ios, all                                           |
| `-p, --public-url [url]`         | The public url that will host the static files (required)              |
| `-c, --clear`                    | Clear the Metro bundler cache                                          |
| `--output-dir [dir]`             | The directory to export the static files to                            |
| `-a, --asset-url [url]`          | The absolute or relative url that will host the asset files            |
| `-d, --dump-assetmap`            | Dump the asset map for further processing                              |
| `--dev`                          | Configure static files for developing locally using a non-https server |
| `-s, --dump-sourcemap`           | Dump the source map for debugging the JS bundle                        |
| `-q, --quiet`                    | Suppress verbose output                                                |
| `-t, --target [managed\|bare]`   | Target environment for which this export is intended                   |
| `--merge-src-dir [dir]`          | A repeatable source dir to merge in                                    |
| `--merge-src-url [url]`          | A repeatable source tar.gz file URL to merge in                        |
| `--max-workers [num]`            | Maximum number of tasks to allow Metro to spawn                        |
| `--experimental-bundle`          | export bundles for use with EAS updates                                |
| `--config [file]`                | Deprecated: Use app.config.js to switch config files instead.          |

</Collapsible>

<Collapsible summary={<><h4>expo init</h4>Create a new Expo project</>}>

Alias: `expo i`

| Option                  | Description                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-t, --template [name]` | Specify which template to use. Valid options are "blank", "tabs", "bare-minimum" or a package on npm (e.g. "expo-template-bare-minimum") that includes an Expo project template. |
| `--npm`                 | Use npm to install dependencies. (default when Yarn is not installed)                                                                                                            |
| `--yarn`                | Use Yarn to install dependencies. (default when Yarn is installed)                                                                                                               |
| `--no-install`          | Skip installing npm packages or CocoaPods.                                                                                                                                       |
| `--name [name]`         | The name of your app visible on the home screen.                                                                                                                                 |
| `--yes`                 | Use default options. Same as "expo init . --template blank                                                                                                                       |

</Collapsible>

<Collapsible summary={<><h4>expo install</h4>Install a module or other package to a project</>}>

Alias: `expo add`

| Option   | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| `--npm`  | Use npm to install dependencies. (default when package-lock.json exists) |
| `--yarn` | Use Yarn to install dependencies. (default when yarn.lock exists)        |

</Collapsible>

<Collapsible summary={<><h4>expo run:android</h4>Run the Android app binary locally</>}>

| Option                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `--no-bundler`          | Skip starting the Metro bundler                               |
| `-d, --device [device]` | Device name to build the app on                               |
| `-p, --port [port]`     | Port to start the Metro bundler on. Default: 8081             |
| `--variant [name]`      | (Android) build variant                                       |
| `--config [file]`       | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo run:ios</h4>Run the iOS app binary locally</>}>

| Option                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| `--no-build-cache`                | Clear the native derived data before building                 |
| `--no-install`                    | Skip installing dependencies                                  |
| `--no-bundler`                    | Skip starting the Metro bundler                               |
| `-d, --device [device]`           | Device name or UDID to build the app on                       |
| `-p, --port [port]`               | Port to start the Metro bundler on. Default: 8081             |
| `--scheme [scheme]`               | Scheme to build                                               |
| `--configuration [configuration]` | Xcode configuration to use. Debug or Release. Default: Debug  |
| `--config [file]`                 | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo send</h4>Share the project's URL to an email address</>}>

| Option                 | Description                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `-s, --send-to [dest]` | Email address to send the URL to                                                                               |
| `--dev-client`         | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`    | Custom URI protocol to use with a development build                                                            |
| `-a, --android`        | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`            | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`            | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`    | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`             | Same as --host tunnel                                                                                          |
| `--lan`                | Same as --host lan                                                                                             |
| `--localhost`          | Same as --host localhost                                                                                       |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                                  |

</Collapsible>

<Collapsible summary={<><h4>expo start</h4>Start a local dev server for the app</>}>

Alias: `expo r`

| Option                                  | Description                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `-s, --send-to [dest]`                  | An email address to send a link to                                                                             |
| `-c, --clear`                           | Clear the Metro bundler cache                                                                                  |
| `--max-workers [num]`                   | Maximum number of tasks to allow Metro to spawn.                                                               |
| `--no-dev`                              | Turn development mode off                                                                                      |
| `--minify`                              | Minify code                                                                                                    |
| `--https`                               | To start webpack with https protocol                                                                           |
| `--force-manifest-type [manifest-type]` | Override auto detection of manifest type                                                                       |
| `-p, --port [port]`                     | Port to start the native Metro bundler on (does not apply to web or tunnel). Default: 19000                    |
| `--dev-client`                          | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`                     | Custom URI protocol to use with a development build                                                            |
| `-a, --android`                         | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`                             | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`                             | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`                     | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`                              | Same as --host tunnel                                                                                          |
| `--lan`                                 | Same as --host lan                                                                                             |
| `--localhost`                           | Same as --host localhost                                                                                       |
| `--offline`                             | Allows this command to run while offline                                                                       |
| `--dev`                                 | Deprecated: Dev mode is used by default                                                                        |
| `--no-minify`                           | Deprecated: Minify is disabled by default                                                                      |
| `--no-https`                            | Deprecated: https is disabled by default                                                                       |
| `--config [file]`                       | Deprecated: Use app.config.js to switch config files instead.                                                  |

</Collapsible>

<Collapsible summary={<><h4>expo start:web</h4>Start a Webpack dev server for the web app</>}>

Alias: `expo web`

| Option                                  | Description                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--no-dev`                              | Turn development mode off                                                                                      |
| `--minify`                              | Minify code                                                                                                    |
| `--https`                               | To start webpack with https protocol                                                                           |
| `--force-manifest-type [manifest-type]` | Override auto detection of manifest type                                                                       |
| `-p, --port [port]`                     | Port to start the Webpack bundler on. Default: 19006                                                           |
| `-s, --send-to [dest]`                  | An email address to send a link to                                                                             |
| `--dev-client`                          | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]`                     | Custom URI protocol to use with a development build                                                            |
| `-a, --android`                         | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`                             | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`                             | Opens your app in a web browser                                                                                |
| `-m, --host [mode]`                     | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`                              | Same as --host tunnel                                                                                          |
| `--lan`                                 | Same as --host lan                                                                                             |
| `--localhost`                           | Same as --host localhost                                                                                       |
| `--offline`                             | Allows this command to run while offline                                                                       |
| `--dev`                                 | Deprecated: Dev mode is used by default                                                                        |
| `--no-minify`                           | Deprecated: Minify is disabled by default                                                                      |
| `--no-https`                            | Deprecated: https is disabled by default                                                                       |
| `--config [file]`                       | Deprecated: Use app.config.js to switch config files instead.                                                  |

</Collapsible>

---

### Auth

<Collapsible summary={<><h4>expo login</h4>Login to an Expo account</>}>

Alias: `expo signin`

| Option                    | Description                            |
| ------------------------- | -------------------------------------- |
| `-u, --username [string]` | Username                               |
| `-p, --password [string]` | Password                               |
| `--otp [string]`          | One-time password from your 2FA device |

</Collapsible>

<Collapsible summary={<><h4>expo logout</h4>Logout of an Expo account</>}>

This command does not take any options.

</Collapsible>

<Collapsible summary={<><h4>expo register</h4>Sign up for a new Expo account</>}>

This command does not take any options.

</Collapsible>

<Collapsible summary={<><h4>expo whoami</h4>Return the currently authenticated account</>}>

Alias: `expo w`

This command does not take any options.

</Collapsible>

---

### Client

<Collapsible summary={<><h4>expo client:install:ios</h4>Install Expo Go for iOS on the simulator</>}>

| Option     | Description                                                                  |
| ---------- | ---------------------------------------------------------------------------- |
| `--latest` | Install the latest version of Expo Go, ignoring the current project version. |

</Collapsible>

<Collapsible summary={<><h4>expo client:install:android</h4>Install Expo Go for Android on a connected device or emulator</>}>

| Option                  | Description                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `-d, --device [device]` | Device name to install the client on                                       |
| `--latest`              | Install the latest version of Expo Go, ignore the current project version. |

</Collapsible>

---

### Info

<Collapsible summary={<><h4>expo config</h4>Show the project config</>}>

| Option                                      | Description                                                   |
| ------------------------------------------- | ------------------------------------------------------------- |
| `-t, --type [public\|prebuild\|introspect]` | Type of config to show.                                       |
| `--full`                                    | Include all project config data                               |
| `--json`                                    | Output in JSON format                                         |
| `--config [file]`                           | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo diagnostics</h4>Log environment info to the console</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo doctor</h4>Diagnose issues with the project</>}>

| Option               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `--fix-dependencies` | Fix incompatible dependency versions                          |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo upgrade</h4>Upgrade the project packages and config for the given SDK version</>}>

Alias: `expo update`

| Option   | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| `--npm`  | Use npm to install dependencies. (default when package-lock.json exists) |
| `--yarn` | Use Yarn to install dependencies. (default when yarn.lock exists)        |

</Collapsible>

---

### Eject

<Collapsible summary={<><h4>expo customize:web</h4>Eject the default web files for customization</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `-f, --force`     | Allows replacing existing files                               |
| `--offline`       | Allows this command to run while offline                      |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo eject</h4>Create native iOS and Android project files. Learn more: https://docs.expo.dev/workflow/customizing/</>}>

| Option                               | Description                                                           |
| ------------------------------------ | --------------------------------------------------------------------- |
| `--no-install`                       | Skip installing npm packages and CocoaPods.                           |
| `--npm`                              | Use npm to install dependencies. (default when Yarn is not installed) |
| `-p, --platform [all\|android\|ios]` | Platforms to sync: ios, android, all. Default: all                    |
| `--config [file]`                    | Deprecated: Use app.config.js to switch config files instead.         |

</Collapsible>

<Collapsible summary={<><h4>expo prebuild</h4>Create native iOS and Android project files before building natively. Learn more: https://docs.expo.dev/workflow/customizing/</>}>

| Option                                    | Description                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| `--no-install`                            | Skip installing npm packages and CocoaPods.                                             |
| `--clean`                                 | Delete the native folders and regenerate them before applying changes                   |
| `--npm`                                   | Use npm to install dependencies. (default when Yarn is not installed)                   |
| `--template [template]`                   | Project template to clone from. File path pointing to a local tar file or a github repo |
| `-p, --platform [all\|android\|ios]`      | Platforms to sync: ios, android, all. Default: all                                      |
| `--skip-dependency-update [dependencies]` | Preserves versions of listed packages in package.json (comma separated list)            |
| `--config [file]`                         | Deprecated: Use app.config.js to switch config files instead.                           |

</Collapsible>

---

### Publish

<Collapsible summary={<><h4>expo publish</h4>Deploy a project to Expo hosting</>}>

Alias: `expo p`

| Option                         | Description                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `-q, --quiet`                  | Suppress verbose output from the Metro bundler.                                         |
| `-s, --send-to [dest]`         | A phone number or email address to send a link to                                       |
| `-c, --clear`                  | Clear the Metro bundler cache                                                           |
| `-t, --target [managed\|bare]` | Target environment for which this publish is intended. Options are `managed` or `bare`. |
| `--max-workers [num]`          | Maximum number of tasks to allow Metro to spawn.                                        |
| `--release-channel [name]`     | The release channel to publish to. Default is 'default'.                                |
| `--config [file]`              | Deprecated: Use app.config.js to switch config files instead.                           |

</Collapsible>

<Collapsible summary={<><h4>expo publish:set</h4>Specify the channel to serve a published release</>}>

Alias: `expo ps`

| Option                          | Description                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| `-c, --release-channel [name]`  | The channel to set the published release. (Required)                  |
| `-p, --publish-id [publish-id]` | The id of the published release to serve from the channel. (Required) |
| `--config [file]`               | Deprecated: Use app.config.js to switch config files instead.         |

</Collapsible>

<Collapsible summary={<><h4>expo publish:rollback</h4>Undo an update to a channel</>}>

Alias: `expo pr`

| Option                          | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `--channel-id [channel-id]`     | This flag is deprecated.                                      |
| `-c, --release-channel [name]`  | The channel to rollback from. (Required)                      |
| `-s, --sdk-version [version]`   | The sdk version to rollback. (Required)                       |
| `-p, --platform [android\|ios]` | The platform to rollback.                                     |
| `--config [file]`               | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo publish:history</h4>Log the project's releases</>}>

Alias: `expo ph`

| Option                          | Description                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `-c, --release-channel [name]`  | Filter by release channel. If this flag is not included, the most recent publications will be shown. |
| `--count [number-of-logs]`      | Number of logs to view, maximum 100, default 5.                                                      |
| `-p, --platform [android\|ios]` | Filter by platform, android or ios. Defaults to both platforms.                                      |
| `-s, --sdk-version [version]`   | Filter by SDK version e.g. 35.0.0                                                                    |
| `-r, --raw`                     | Produce some raw output.                                                                             |
| `--config [file]`               | Deprecated: Use app.config.js to switch config files instead.                                        |

</Collapsible>

<Collapsible summary={<><h4>expo publish:details</h4>Log details of a published release</>}>

Alias: `expo pd`

| Option                      | Description                                                   |
| --------------------------- | ------------------------------------------------------------- |
| `--publish-id [publish-id]` | Publication id. (Required)                                    |
| `-r, --raw`                 | Produce some raw output.                                      |
| `--config [file]`           | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

---

### Build

<Collapsible summary={<><h4>expo build:web</h4>Build the web app for production</>}>

| Option            | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `-c, --clear`     | Clear all cached build files and assets.                                                       |
| `--no-pwa`        | Prevent webpack from generating the manifest.json and injecting meta into the index.html head. |
| `-d, --dev`       | Turns dev flag on before bundling                                                              |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead.                                  |

</Collapsible>

---

### Credentials

<Collapsible summary={<><h4>expo credentials:manager</h4>Manage your credentials</>}>

| Option                         | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `-p --platform [android\|ios]` | Platform: [android\|ios]                                      |
| `--config [file]`              | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo fetch:ios:certs</h4>Download the project's iOS standalone app signing credentials</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo fetch:android:keystore</h4>Download the project's Android keystore</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo fetch:android:hashes</h4>Compute and log the project's Android key hashes</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo fetch:android:upload-cert</h4>Download the project's Android keystore</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

---

### Notifications

<Collapsible summary={<><h4>expo push:android:upload</h4>Upload an FCM key for Android push notifications</>}>

| Option                | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| `--api-key [api-key]` | Server API key for FCM.                                       |
| `--config [file]`     | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo push:android:show</h4>Log the value currently in use for FCM notifications for this project</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo push:android:clear</h4>Delete a previously uploaded FCM credential</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

---

### Url

<Collapsible summary={<><h4>expo url</h4>Log a URL for opening the project in Expo Go</>}>

Alias: `expo u`

| Option              | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--dev-client`      | Experimental: Starts the bundler for use with the expo-development-client                                      |
| `--scheme [scheme]` | Custom URI protocol to use with a development build                                                            |
| `-a, --android`     | Opens your app in Expo Go on a connected Android device                                                        |
| `-i, --ios`         | Opens your app in Expo Go in a currently running iOS simulator on your computer                                |
| `-w, --web`         | Opens your app in a web browser                                                                                |
| `-m, --host [mode]` | lan (default), tunnel, localhost. Type of host to use. "tunnel" allows you to view your link on other networks |
| `--tunnel`          | Same as --host tunnel                                                                                          |
| `--lan`             | Same as --host lan                                                                                             |
| `--localhost`       | Same as --host localhost                                                                                       |
| `--offline`         | Allows this command to run while offline                                                                       |
| `--config [file]`   | Deprecated: Use app.config.js to switch config files instead.                                                  |

</Collapsible>

<Collapsible summary={<><h4>expo url:ipa</h4>Log the download URL for the standalone iOS binary</>}>

| Option               | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps) |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.   |

</Collapsible>

<Collapsible summary={<><h4>expo url:apk</h4>Log the download URL for the standalone Android binary</>}>

| Option               | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps) |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.   |

</Collapsible>

---

### Webhooks

<Collapsible summary={<><h4>expo webhooks</h4>List all webhooks for a project</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo webhooks:add</h4>Add a webhook to a project</>}>

| Option                 | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `--url [url]`          | URL to request. (Required)                                                                              |
| `--event [event-type]` | Event type that triggers the webhook. [build] (Required)                                                |
| `--secret [secret]`    | Secret used to create a hash signature of the request payload, provided in the 'Expo-Signature' header. |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                           |

</Collapsible>

<Collapsible summary={<><h4>expo webhooks:remove</h4>Delete a webhook</>}>

| Option            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--id [id]`       | ID of the webhook to remove.                                  |
| `--config [file]` | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo webhooks:update</h4>Update an existing webhook</>}>

| Option                 | Description                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| `--id [id]`            | ID of the webhook to update.                                                                            |
| `--url [url]`          | URL the webhook will request.                                                                           |
| `--event [event-type]` | Event type that triggers the webhook. [build]                                                           |
| `--secret [secret]`    | Secret used to create a hash signature of the request payload, provided in the 'Expo-Signature' header. |
| `--config [file]`      | Deprecated: Use app.config.js to switch config files instead.                                           |

</Collapsible>

---

### Deprecated

<Collapsible summary={<><h4>expo build:ios</h4>Superseded by eas build in eas-cli</>}>

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
| `-t --type [archive\|simulator]`     | Type of build: [archive\|simulator].                                                                                |
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

</Collapsible>

<Collapsible summary={<><h4>expo build:android</h4>Superseded by eas build in eas-cli</>}>

Alias: `expo ba`

| Option                        | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `-c, --clear-credentials`     | Clear stored credentials.                                       |
| `--release-channel [name]`    | Pull from specified release channel.                            |
| `--no-publish`                | Disable automatic publishing before building.                   |
| `--no-wait`                   | Exit immediately after triggering build.                        |
| `--keystore-path [path]`      | Path to your Keystore: \*.jks.                                  |
| `--keystore-alias [alias]`    | Keystore Alias                                                  |
| `--generate-keystore`         | [deprecated] Generate Keystore if one does not exist            |
| `--public-url [url]`          | The URL of an externally hosted manifest (for self-hosted apps) |
| `--skip-workflow-check`       | Skip warning about build service bare workflow limitations.     |
| `-t --type [app-bundle\|apk]` | Type of build: [app-bundle\|apk].                               |
| `--config [file]`             | Deprecated: Use app.config.js to switch config files instead.   |

</Collapsible>

<Collapsible summary={<><h4>expo build:status</h4>Superseded by eas build:list in eas-cli</>}>

Alias: `expo bs`

| Option               | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `--public-url [url]` | The URL of an externally hosted manifest (for self-hosted apps). |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.    |

</Collapsible>

<Collapsible summary={<><h4>expo upload:android</h4>Superseded by eas submit in eas-cli</>}>

Alias: `expo ua`

| Option                                | Description                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| `--verbose`                           | Migrate to eas submit --verbose                               |
| `--latest`                            | Migrate to eas submit --latest                                |
| `--id [id]`                           | Migrate to eas submit --id [id]                               |
| `--path [path]`                       | Migrate to eas submit --path [path]                           |
| `--url [url]`                         | Migrate to eas submit --url [url]                             |
| `--android-package [android-package]` | Migrate to eas submit (android-package is auto inferred)      |
| `--type [archive-type]`               | Migrate to eas submit (type is auto inferred)                 |
| `--key [key]`                         | Migrate to eas.json's serviceAccountKeyPath property          |
| `--track [track]`                     | Migrate to eas.json's track property                          |
| `--release-status [release-status]`   | Migrate to eas.json's releaseStatus property                  |
| `--config [file]`                     | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo upload:ios</h4>Superseded by eas submit in eas-cli</>}>

Alias: `expo ui`

| Option                          | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `--verbose`                     | Migrate to eas submit --verbose                               |
| `--latest`                      | Migrate to eas submit --latest                                |
| `--id [id]`                     | Migrate to eas submit --id [id]                               |
| `--path [path]`                 | Migrate to eas submit --path [path]                           |
| `--url [url]`                   | Migrate to eas submit --url [url]                             |
| `--apple-id [apple-id]`         | Migrate to eas.json's appleId property                        |
| `--itc-team-id [itc-team-id]`   | Migrate to eas.json's appleTeamId property                    |
| `--app-name [app-name]`         | Migrate to eas.json's appName property                        |
| `--company-name [company-name]` | Migrate to eas.json's companyName property                    |
| `--sku [sku]`                   | Migrate to eas.json's sku property                            |
| `--language [language]`         | Migrate to eas.json's language property                       |
| `--config [file]`               | Deprecated: Use app.config.js to switch config files instead. |

</Collapsible>

<Collapsible summary={<><h4>expo client:ios</h4>Superseded by Expo Dev Clients</>}>

| Option               | Description                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `--apple-id [login]` | Apple ID username (please also set the Apple ID password as EXPO_APPLE_PASSWORD environment variable). |
| `--config [file]`    | Deprecated: Use app.config.js to switch config files instead.                                          |

</Collapsible>

{/* END GENERATED BLOCK. DO NOT MODIFY MANUALLY. */}

## Expo CLI Migration

In Expo SDK 46, we migrated to a new suite of tooling that is versioned in the `expo` package. Below is a migration guide showing where the legacy `expo-cli` commands live now.

> Legacy `expo-cli` will be in maintenance mode and continue to work while we migrate to the new tooling.

| Legacy               | New                    | Notes                                         |
| -------------------- | ---------------------- | --------------------------------------------- |
| `expo init`          | `npx create-expo-app`  | New CLI                                       |
| `expo start`         | `npx expo start`       | Versioned                                     |
| `expo export`        | `npx expo export`      | Versioned, `--experimental-bundle` is default |
| `expo install`       | `npx expo install`     | Versioned                                     |
| `expo run:android`   | `npx expo run:android` | Versioned                                     |
| `expo run:ios`       | `npx expo run:ios`     | Versioned                                     |
| `expo login`         | `npx expo login`       | Versioned                                     |
| `expo logout`        | `npx expo logout`      | Versioned                                     |
| `expo register`      | `npx expo register`    | Versioned                                     |
| `expo whoami`        | `npx expo whoami`      | Versioned                                     |
| `expo config`        | `npx expo config`      | Versioned                                     |
| `expo prebuild`      | `npx expo prebuild`    | Versioned                                     |
| `expo customize:web` | `npx expo customize`   | Versioned, and renamed                        |
| `expo build:web`     | `npx expo export:web`  | Versioned, and renamed                        |
| `expo eject`         | `npx expo prebuild`    | Merged into `npx expo prebuild`               |
| `expo start:web`     | `npx expo start`       | Merged into `npx expo start`                  |

### Deprecated

| Legacy                        | Notes                           |
| ----------------------------- | ------------------------------- |
| `expo client:ios`             | Removed in favor of Dev Clients |
| `expo send`                   | Removed                         |
| `expo client:install:ios`     | Unimplemented                   |
| `expo client:install:android` | Unimplemented                   |
| `expo doctor`                 | Undecided                       |
| `expo upgrade`                | Undecided                       |

### Services

> The new `expo update` command uses a different hosting service than the legacy `expo publish` command.

| Legacy                           | New                     | Notes              |
| -------------------------------- | ----------------------- | ------------------ |
| `expo publish`                   | `eas update`            | Moved to `eas-cli` |
| `expo publish:set`               | `eas update`            | Moved to `eas-cli` |
| `expo publish:rollback`          | `eas update`            | Moved to `eas-cli` |
| `expo publish:history`           | `eas update`            | Moved to `eas-cli` |
| `expo publish:details`           | `eas update`            | Moved to `eas-cli` |
| `expo credentials:manager`       | `eas credentials`       | Moved to `eas-cli` |
| `expo fetch:ios:certs`           | `eas credentials`       | Moved to `eas-cli` |
| `expo fetch:android:keystore`    | `eas credentials`       | Moved to `eas-cli` |
| `expo fetch:android:hashes`      | `eas credentials`       | Moved to `eas-cli` |
| `expo fetch:android:upload-cert` | `eas credentials`       | Moved to `eas-cli` |
| `expo push:android:upload`       | `eas credentials`       | Moved to `eas-cli` |
| `expo push:android:show`         | `eas credentials`       | Moved to `eas-cli` |
| `expo push:android:clear`        | `eas credentials`       | Moved to `eas-cli` |
| `expo url`                       | `eas build:list`        | Moved to `eas-cli` |
| `expo url:ipa`                   | `eas build:list`        | Moved to `eas-cli` |
| `expo url:apk`                   | `eas build:list`        | Moved to `eas-cli` |
| `expo webhooks`                  | `eas webhook`           | Moved to `eas-cli` |
| `expo webhooks:add`              | `eas webhook:create`    | Moved to `eas-cli` |
| `expo webhooks:remove`           | `eas webhook:delete`    | Moved to `eas-cli` |
| `expo webhooks:update`           | `eas webhook:update`    | Moved to `eas-cli` |
| `expo build:ios`                 | `eas build -p ios`      | Moved to `eas-cli` |
| `expo build:android`             | `eas build -p android`  | Moved to `eas-cli` |
| `expo build:status`              | `eas build:list`        | Moved to `eas-cli` |
| `expo upload:android`            | `eas submit -p android` | Moved to `eas-cli` |
| `expo upload:ios`                | `eas submit -p ios`     | Moved to `eas-cli` |

### Other Notes

- Dev Tools UI has been deprecated in favor of the the CLI's Terminal UI, Flipper, and Remote Debugging.
- `npx expo install` now supports installing the correct version of `react-native`, `react`, `react-dom` automatically.
- Tooling now supports `pnpm` along with Yarn and npm, the default is still Yarn.
- Dropped the deprecated `--config` argument across all commands. Use `app.config.js` instead.
- No longer shipping `adb` in the CLI. Users must manually install `adb` to interact with connected Android devices.
- Experimental `$EXPO_USE_APPLE_DEVICE` feature (`expo run:ios -d`) is now the default behavior. Global `ios-deploy` package is no longer required.
- `npx expo export` works like `expo export --experimental-bundle`, i.e. exports for `eas update` and not `expo publish`. [PR](https://github.com/expo/expo/pull/17034).
  - Dropped arguments: `--public-url`, `--asset-url`, `--merge-src-url`, `--merge-src-dir`, `-t, --target`, `--experimental-bundle`, `--config`, `-q, --quiet`
  - Dropped aliases for `--dump-assetmap` (`-d`) and `--dump-sourcemap` (`-s`).
  - Dropped warning about clearing `dist` folder that is shown between runs, this is akin to all other bundler commands across web tooling.
  - Dropped all merging code because experimental bundle does not support index files so we don't need to support merging index files.
  - Dropped the quiet flag as this appears to do nothing anymore.
- Parts of `expo upgrade` and `expo doctor` have been merged into `npx expo install` via the `--fix` and `--check` flags. [PR](https://github.com/expo/expo/pull/17048).
- Dropped unused generated `.exprc`, `.expo/packager-info.json` files.
- Dropped all deprecated support for `*.expo.js` files.
- Reduced usage of `.expo/settings.json` to provide a more sandboxed state between processes.

#### Environment Variables

- Dropped `$XDL_PORT`, `$XDL_HOST`, `$XDL_SCHEME`, `$SERVER_URL` in favor of `$EXPO_STAGING` and `$EXPO_LOCAL` environment variables.
