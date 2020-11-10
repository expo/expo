---
title: Expo CLI
---

Expo CLI is a command line app that is the main interface between a developer and Expo tools. You'll use it for a variety of tasks, such as:

- Creating new projects
- Developing your app: running the project server, viewing logs, opening your app in a simulator
- [Publishing](publishing.md) your app JavaScript and other assets and managing releasing them over the air
- [Building binaries](../distribution/building-standalone-apps.md) (`apk` and `ipa` files) to be [uploaded to the App Store and Play Store](../distribution/uploading-apps.md)
- Managing Apple Credentials and Google Keystores

You may use the CLI in your terminal or use the web based interface (it opens automatically by default, or you can press d from the CLI to open it on demand). The web interface enables you to use some of the most often used features from a quick-to-use graphical interface. We’ve only scratched the surface of what expo-cli can do so far. Be sure to check out all the possible commands below!

## Installation

```
npm install -g expo-cli
```

## Checking CLI Version

Run `expo --version` to determine what version you are currently working with.

## Commands

The commands listed below are derived from the latest version of Expo CLI. You can view the list of commands available with your version in your terminal using `expo --help`. To learn more about a specific command and its options use `expo [command] --help`.

```
Usage: expo [command] [options]

```

<details><summary><h3>expo android</h3><p>Opens your app in the Expo client on a connected Android device.</p></summary>
<p>

| Option            | Description                       |
| ----------------- | --------------------------------- |
| `--offline`       | Run this command in offline mode. |
| `--config` [path] | Specify a path to app.json.       |

</p>
</details>

<details><summary><h3>expo build:ios</h3><p>Build a standalone IPA for your project, signed and ready for submission to the Apple App Store.</p></summary>
<p>

Alias: `expo bi`

| Option                               | Description                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `--apple-id` [id]                    | Apple ID username. Set your Apple ID password as `EXPO_APPLE_PASSWORD` env variable.              |
| `--type`, `-t` [type]                | Select the type of build: [archive or simulator] The default is archive.                          |
| `--release-channel` [channel]        | Pull bundle from specified release channel. If not specified, the `default` channel is used.      |
| `--no-publish`                       | Prevents an OTA update from occurring during the build process.                                   |
| `--no-wait`                          | Exit immediately after scheduling build.                                                          |
| `--team-id` [id]                     | Apple Team ID.                                                                                    |
| `--dist-p12-path` [path]             | Path to your Distribution Certificate. Set password as `EXPO_IOS_DIST_P12_PASSWORD` env variable. |
| `--push-id` [id]                     | Push Notification Key. Example: 123AB4C56D                                                        |
| `--push-p8-path` [path]              | Path to your Push Notification Key .p8 file.                                                      |
| `--provisioning-profile-path` [path] | Path to your provisioning profile.                                                                |
| `--public-url` [url]                 | The url of an externally hosted manifest for self-hosted apps.                                    |
| `--config` [path]                    | Specify a path to app.json.                                                                       |

</p>
</details>

<details><summary><h3>expo build:android</h3><p>Build a standalone APK or App Bundle for your project, signed and ready for submission to the Google Play Store.</p></summary>
<p>

Alias: `expo ba`

| Option                        | Description                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| `--release-channel` [channel] | Pull bundle from specified release channel. If not specified, the `default` channel is used. |
| `--no-publish`                | Prevents an OTA update from occurring during the build process.                              |
| `--no-wait`                   | Exit immediately after scheduling build.                                                     |
| `--keystore-path` [path]      | Path to your Keystore file.                                                                  |
| `--public-url` [url]          | The url of an externally hosted manifest for self-hosted apps.                               |
| `--type`, `-t` [type]         | Select the type of build: [app-bundle or apk] The default is apk.                            |
| `--config` [path]             | Specify a path to app.json.                                                                  |

</p>
</details>

<details><summary><h3>expo build:web</h3><p>Build a production bundle for your project, compressed and ready for deployment.</p></summary>
<p>

| Option            | Description                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `--pollyfill`     | Include @babel/polyfill.                                                                           |
| `--no-pwa`        | Prevent webpack from generating the `manifest.json` and injecting meta into the `index.html` head. |
| `--dev`, `-d`     | Turns dev mode on before bundling                                                                  |
| `--config` [path] | Specify a path to app.json.                                                                        |

</p>
</details>

<details><summary><h3>expo build:status</h3><p>Gets the status of a current (or most recently finished) build for your project.</p></summary>
<p>

Alias: `expo bs`

| Option               | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `--public-url` [url] | The url of an externally hosted manifest for self-hosted apps. |
| `--config` [path]    | Specify a path to app.json.                                    |

</p>
</details>

<details><summary><h3>expo bundle-assets</h3><p>Bundles assets for a detached app. This command should be executed from xcode or gradle.</p></summary>
<p>

| Option                  | Description                       |
| ----------------------- | --------------------------------- |
| `--dest` [dest]         | Destination directory for assets. |
| `--platform` [platform] | Detached project platform.        |
| `--config` [path]       | Specify a path to app.json.       |

</p>
</details>

<details><summary><h3>expo client:ios</h3><p>Build a custom version of the Expo client for iOS using your own Apple credentials and install it on your mobile device using Safari.</p></summary>
<p>

| Option                 | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `--apple-id`[username] | Apple ID username. Set your Apple ID password as `EXPO_APPLE_PASSWORD` env variable. |
| `--config` [path]      | Specify a path to app.json.                                                          |

</p>
</details>

<details><summary><h3>expo client:install:ios</h3><p>Install the latest version of Expo client for iOS on the simulator.
</p></summary>
</details>

<details><summary><h3>expo client:install:android</h3><p>Install the latest version of Expo client for Android on a connected device or emulator.
</p></summary>
</details>

<details><summary><h3>expo credentials:manager</h3><p>Manage your iOS or Android credentials.</p></summary>
<p>

| Option                        | Description                      |
| ----------------------------- | -------------------------------- |
| `--platform`, `-p` [platform] | Select platform [android or ios] |

</p>
</details>

<details><summary><h3>expo customize:web</h3><p>Generate static web files into your project.</p></summary>
<p>

| Option          | Description                       |
| --------------- | --------------------------------- |
| `--force`, `-f` | Allows replacing existing files.  |
| `--offline`     | Run this command in offline mode. |

</p>
</details>

<details><summary><h3>expo diagnostics</h3><p>Prints environment info to the console.</p></summary>
</details>

<details><summary><h3>expo doctor</h3><p>Diagnoses issues with your Expo project.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo eject</h3><p>Creates Xcode and Android Studio projects for your app. Use this if you need to add custom native functionality.</p></summary>
<p>

| Option                  | Description                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--eject-method` [type] | Eject method to use [plain or expokit (deprecated and not recommended)]. If not specificed, the command will ask which to use. Required when using `--non-interactive` option. |
| `--force`, `-f`         | Will attempt to generate an iOS project even when the system is not running macOS. Unsafe and may fail.                                                                        |
| `--config` [path]       | Specify a path to app.json.                                                                                                                                                    |

</p>
</details>

<details><summary><h3>expo export</h3><p>Exports the static files of the app for hosting it on a web server.</p></summary>
<p>

| Option                     | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--public-url`, `-p` [url] | The public url that will host the static files. **required**                                                                |
| `--output-dir` [dir]       | The directory to export the static files to. Default directory is `dist`.                                                   |
| `--asset-url`, `-a`        | The absolute or elative url that will host asset files. Default is `./assets` which will be resolved agains the public-url. |
| `--dump-assetmap`, `-d`    | Dump the asset map for further processing.                                                                                  |
| `--dev`                    | Configures static files for developing locally using a non-https server.                                                    |
| `--dump-sourcemap`, `-s`   | Dump the source map for debugging the JS bundle.                                                                            |
| `--quiet`, `-q`            | Suppress the verbose output from React Native packager.                                                                     |
| `--merge-src-dir` [dir]    | A repeatable source dir to merge in.                                                                                        |
| `--merge-src-url` [url]    | A repeatable source tar.gz file url to merge in.                                                                            |
| `--max-workers` [number]   | Maxinum number of tasks to allow Metro to spawn.                                                                            |
| `--config` [path]          | Specify a path to app.json.                                                                                                 |

</p>
</details>

<details><summary><h3>expo fetch:ios:certs</h3><p>Fetch this project's iOS certificates/keys and provisioning profile. Writes files to the PROJECT_DIR and prints passwords to stdout.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo fetch:android:keystore</h3><p>Fetch this project's Android keystore. Writes keystore to PROJECT_DIR/PROJECT_NAME.jks and prints passwords to stdout.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo fetch:android:hashes</h3><p>Fetch this project's Android key hashes needed to set up Google/Facebook authentication. Note: if you are using Google Play signing, this app will be signed with a different key after publishing to the store, and you'll need to use the hashes displayed in the Google Play console.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo fetch:android:upload-cert</h3><p>Fetch this project's upload certificate needed after opting in to app signing by Google Play or after resetting a previous upload certificate.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo generate-module</h3><p>Generate a universal module for Expo from a template in a directory.</p></summary>
<p>

| Option             | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| `--template` [dir] | Local directory or npm package containing a template for a universal Expo module. |

</p>
</details>

<details><summary><h3>expo init</h3><p>Initializes a directory with an example project. Run it without any options and you will be prompted for the name and type.
</p></summary>
<p>

Alias: `expo i`

| Option                    | Description                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--template`, `-t` [name] | Specify which template to use. Options are [blank, tabs or bare-minimum] or the package name on npm (e.g. "expo-template-bare-typescript"). |
| `--yarn`                  | Use Yarn to install dependencies. The default when Yarn is installed.                                                                       |
| `--name` [name]           | The name of your app visible on the home screen.                                                                                            |

</p>
</details>

<details><summary><h3>expo install</h3><p>Installs a unimodule or other package to a project.</p></summary>
<p>

| Option   | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `--npm`  | Use npm to install dependencies. The default when package-lock.json exists. |
| `--yarn` | Use Yarn to install dependencies. The default when yarn.lock exists.        |

</p>
</details>

<details><summary><h3>expo ios</h3><p>Opens your app in the Expo client in an iOS simulator.</p></summary>
<p>

| Option            | Description                       |
| ----------------- | --------------------------------- |
| `--offline`       | Run this command in offline mode. |
| `--config` [path] | Specify a path to app.json.       |

</p>
</details>

<details><summary><h3>expo login</h3><p>Login with your Expo account.</p></summary>
<p>

Alias: `expo signin`

| Option                       | Description    |
| ---------------------------- | -------------- |
| `--username`, `-u`[username] | Expo username. |
| `--password` `-p` [password] | Expo password. |

</p>
</details>

<details><summary><h3>expo logout</h3><p>Log out from your Expo account.</p></summary>
</details>

<details><summary><h3>expo opt-in-google-play-signing</h3><p>Switch from the old method of signing APKs to the new App Signing by Google Play. The APK will be signed with an upload key and after uploading it to the store, app will be re-signed with the key from the original keystore.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>npx expo-optimize</h3><p>Compress the assets in your Expo project.</p></summary>
<p>

Alias: `expo o`

| Option                | Description                                                                |
| --------------------- | -------------------------------------------------------------------------- |
| `--save`, `-s`        | Save the original assets with an .orig extension.                          |
| `--quality` [number]  | Specify the quality of the compressed image. Default is 80.                |
| `--include` [pattern] | Include only assets that match this glob pattern relative to project root. |
| `--exclude` [pattern] | Exclude all assets that match this glob pattern relative to project root.  |
| `--offline`           | Run this command in offline mode.                                          |

</p>
</details>

<details><summary><h3>expo publish</h3><p>Publishes your project to exp.host.</p></summary>
<p>

Alias: `expo p`

| Option                        | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `--quiet`, `-q`               | Suppress verbose output from React Native packager.            |
| `--send-to`, `-s`             | A phone number or email address to send link to.               |
| `--clear`, `-c`               | Clear the React Native Packager cache.                         |
| `--max-workers` [number]      | Maximum number of tasks to allow Metro to spawn.               |
| `--release-channel` [channel] | The release channel to publish to. The default is `'default'`. |
| `--config` [path]             | Specify a path to app.json.                                    |

</p>
</details>

<details><summary><h3>expo publish:history</h3><p>View a log of your published releases.</p></summary>
<p>

Alias: `expo ph`

| Option                              | Description                                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `--release-channel`, `-c` [channel] | Filter by release channel. If this flag is not passed, the most recent publications will be shown. |
| `--count` [number]                  | The number of logs to view. The default is 5. Maximum is 100.                                      |
| `--platform`, `-p` [platform]       | Filter by platform. [android or ios]                                                               |
| `--raw`, `-r`                       | Produce raw output.                                                                                |
| `--config` [path]                   | Specify a path to app.json.                                                                        |

</p>
</details>

<details><summary><h3>expo publish:details</h3><p>View the details of a published release.</p></summary>
<p>

Alias: `expo pd`

| Option              | Description                    |
| ------------------- | ------------------------------ |
| `--publish-id` [id] | Publication id. **(required)** |
| `--raw`, `-r`       | Produce raw output.            |
| `--config` [path]   | Specify a path to app.json.    |

</p>
</details>

<details><summary><h3>expo publish:set</h3><p>Set a published release to be served from a specified channel.</p></summary>
<p>

Alias: `expo ps`

| Option                              | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `--release-channel`, `-c` [channel] | The channel to set the published release.                                 |
| `--publish-id` [id]                 | The id of the published release to serve from the channel. **(required)** |
| `--raw`, `-r`                       | Produce raw output.                                                       |
| `--config` [path]                   | Specify a path to app.json.                                               |

</p>
</details>

<details><summary><h3>expo publish:rollback</h3><p>Rollback an update to a channel.</p></summary>
<p>

Alias: `expo pr`

| Option                   | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `--channel-id` [channel] | The channel id to rollback in the channel. **(required)** |
| `--config` [path]        | Specify a path to app.json.                               |

</p>
</details>

<details><summary><h3>expo push:android:upload</h3><p>Uploads a Firebase Cloud Messaging key for Android push notifications.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--api-key` [key] | Server API key for FCM.     |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo push:android:show</h3><p>Print the value currently in use for FCM notifications for this project.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo push:android:clear</h3><p>Deletes a previously uploaded FCM API key.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo register</h3><p>Sign up for a new Expo account via terminal prompts.</p></summary>
</details>

<details><summary><h3>expo send</h3><p>Sends a link to your project to a specified email.</p></summary>
<p>

| Option                    | Description                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--send-to`, `-s` [email] | Specifies what email to send project url to.                                                                              |
| `--android`, `-a`         | Opens your app in the Expo client on a connected Android device.                                                          |
| `--ios`, `-i`             | Opens your app in the Expo client in a currently running iOS simulator on your computer.                                  |
| `--web`, `-w`             | Opens your app in a web browser.                                                                                          |
| `--host`, `-m` [mode]     | Type of host to use. [lan, localhost or tunnel]. Tunnel allows you to view your link from other networks. Default is lan. |
| `--tunnel`                | Same as `--host tunnel`                                                                                                   |
| `--lan`                   | Same as `--host lan`                                                                                                      |
| `--localhost`             | Same as `--host localhost`                                                                                                |
| `--dev`                   | Turns dev mode on.                                                                                                        |
| `--no-dev`                | Turns dev mode off.                                                                                                       |
| `--minify`                | Turns minfication on.                                                                                                     |
| `--no-minify`             | Turns minfication off.                                                                                                    |
| `--https`                 | Start a webpack with **https** protocol.                                                                                  |
| `--no-https`              | Start a webpack with **http** protocol.                                                                                   |
| `--config` [path]         | Specify a path to app.json.                                                                                               |

</p>
</details>

<details><summary><h3>expo start</h3><p>Starts or restarts a local server for your app and gives you a url to it.</p></summary>
<p>

Alias: `expo r`

| Option                    | Description                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--clear`, `-c`           | Clear the React Native Packager cache.                                                                                    |
| `--max-workers` [number]  | Maximum number of tasks to allow Metro to spawn.                                                                          |
| `--web-only`              | Only start the webpack server.                                                                                            |
| `--send-to`, `-s` [email] | Specifies what email to send project url to.                                                                              |
| `--android`, `-a`         | Opens your app in the Expo client on a connected Android device.                                                          |
| `--ios`, `-i`             | Opens your app in the Expo client in a currently running iOS simulator on your computer.                                  |
| `--web`, `-w`             | Opens your app in a web browser.                                                                                          |
| `--host`, `-m` [mode]     | Type of host to use. [lan, localhost or tunnel]. Tunnel allows you to view your link from other networks. Default is lan. |
| `--tunnel`                | Same as `--host tunnel`                                                                                                   |
| `--lan`                   | Same as `--host lan`                                                                                                      |
| `--localhost`             | Same as `--host localhost`                                                                                                |
| `--dev`                   | Turns dev mode on.                                                                                                        |
| `--no-dev`                | Turns dev mode off.                                                                                                       |
| `--minify`                | Turns minfication on.                                                                                                     |
| `--no-minify`             | Turns minfication off.                                                                                                    |
| `--https`                 | Start a webpack with **https** protocol.                                                                                  |
| `--no-https`              | Start a webpack with **http** protocol.                                                                                   |
| `--offline`               | Run this command in offline mode.                                                                                         |
| `--config` [path]         | Specify a path to app.json.                                                                                               |

</p>
</details>

<details><summary><h3>expo upgrade</h3><p>Upgrade your project to a newer SDK version.
</p></summary>
<p>

| Option   | Description                           |
| -------- | ------------------------------------- |
| `--npm`  | Use npm to install updated packages.  |
| `--yarn` | Use yarn to install updated packages. |

</p>
</details>

<details><summary><h3>expo upload:android</h3><p>Uploads a standalone Android app to Google Play (works on macOS only). Uploads the latest build by default.</p></summary>
<p>

Alias: `expo ua`

| Option            | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `--latest`        | Uploads the latest build. This is the default behavior.     |
| `--id` [id]       | Id of the build to upload.                                  |
| `--path` [path]   | Path to the desired .apk file.                              |
| `--key` [path]    | Path to the JSON key used to authenticate with Google Play. |
| `--config` [path] | Specify a path to app.json.                                 |

</p>
</details>

<details><summary><h3>expo upload:ios</h3><p>Uploads a standalone app to Apple TestFlight (works on macOS only). Uploads the latest build by default.
</p></summary>
<p>

Alias: `expo ui`

| Option                           | Description                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--latest`                       | Uploads the latest build. This is the default behavior.                                                                                                                                                                                                                                                                                        |
| `--id` [id]                      | Id of the build to upload.                                                                                                                                                                                                                                                                                                                     |
| `--path` [path]                  | Path to the desired .ipa file.                                                                                                                                                                                                                                                                                                                 |
| `--apple-id` [id]                | Apple ID username. You can also set your username as `EXPO_APPLE_ID` env variable.                                                                                                                                                                                                                                                             |
| `--itc-team-id` [id]             | App Store Connect Team ID (optional if there is only one team available).                                                                                                                                                                                                                                                                      |
| `--apple-id-password` [password] | Apple ID password. You can also set your password as `EXPO_APPLE_ID_PASSWORD` env variable.                                                                                                                                                                                                                                                    |
| `--app-name` [name]              | The name of your app as it will appear on the App Store. Max character limit is 30. Defaults to value from `expo.name` in your `app.json`                                                                                                                                                                                                      |
| `--sku` [sku]                    | A unqiue ID for your app that is not visible on the App Store. Will be generated if not provided.                                                                                                                                                                                                                                              |
| `--language` [language]          | Primary language. Options: Brazilian Portuguese, Danish, Dutch, English, English_Australian, English_CA, English_UK, Finnish, French, French_CA, German, Greek, Indonesian, Italian, Japanese, Korean, Malay, Norwegian, Portuguese, Russian, Simplified Chinese, Spanish, Spanish_MX, Swedish, Thai, Traditional Chinese, Turkish, Vietnamese |
| `--public-url` [url]             | The url of an externally hosted manifest for self-host apps.                                                                                                                                                                                                                                                                                   |
| `--config` [path]                | Specify a path to app.json.                                                                                                                                                                                                                                                                                                                    |

</p>
</details>

<details><summary><h3>expo url</h3><p>Displays the url you can use to view your project in Expo.
</p></summary>
<p>

Alias: `expo u`

| Option                | Description                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--android`, `-a`     | Opens your app in the Expo client on a connected Android device.                                                          |
| `--ios`, `-i`         | Opens your app in the Expo client in a currently running iOS simulator on your computer.                                  |
| `--web`, `-w`         | Opens your app in a web browser.                                                                                          |
| `--host`, `-m` [mode] | Type of host to use. [lan, localhost or tunnel]. Tunnel allows you to view your link from other networks. Default is lan. |
| `--tunnel`            | Same as `--host tunnel`                                                                                                   |
| `--lan`               | Same as `--host lan`                                                                                                      |
| `--localhost`         | Same as `--host localhost`                                                                                                |
| `--dev`               | Turns dev mode on.                                                                                                        |
| `--no-dev`            | Turns dev mode off.                                                                                                       |
| `--minify`            | Turns minfication on.                                                                                                     |
| `--no-minify`         | Turns minfication off.                                                                                                    |
| `--https`             | Start a webpack with **https** protocol.                                                                                  |
| `--no-https`          | Start a webpack with **http** protocol.                                                                                   |
| `--config` [path]     | Specify a path to app.json.                                                                                               |

</p>
</details>

<details><summary><h3>expo url:ipa</h3><p>Displays the standalone iOS binary url you can use to download your app binary
.</p></summary>
<p>

| Option               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `--public-url` [url] | The url of an externally hosted manifest for self-host apps. |
| `--config` [path]    | Specify a path to app.json.                                  |

</p>
</details>

<details><summary><h3>expo url:apk</h3><p>Displays the standalone Android binary url you can use to download your app binary.
</p></summary>
<p>

| Option               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `--public-url` [url] | The url of an externally hosted manifest for self-host apps. |
| `--config` [path]    | Specify a path to app.json.                                  |

</p>
</details>

<details><summary><h3>expo webhooks:add</h3><p>Create a new webhook for the project.</p></summary>
<p>

| Option              | Description                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--url` [url]       | Webhook to be called after building the app.                                                                            |
| `--event` [type]    | The type of webhook: [build].                                                                                           |
| `--secret` [secret] | Secret to be used to calculate the webhook request payload signature. See docs for more details. Must be 16 chars long. |
| `--config` [path]   | Specify a path to app.json.                                                                                             |

</p>
</details>

<details><summary><h3>expo webhooks</h3><p>List all webhooks for a project.</p></summary>
<p>

| Option            | Description                 |
| ----------------- | --------------------------- |
| `--config` [path] | Specify a path to app.json. |

</p>
</details>

<details><summary><h3>expo webhooks:remove</h3><p>Delete a webhook associated with an Expo project.
</p></summary>
<p>

| Option            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `--id` [id]       | ID of the webhook to remove (see `expo webhooks`) |
| `--config` [path] | Specify a path to app.json.                       |

</p>
</details>

<details><summary><h3>expo webhooks:update</h3><p>Update a webhook associated with an Expo project.
</p></summary>
<p>

| Option              | Description                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--id` [id]         | ID of the webhook to remove (see `expo webhooks`)                                                                       |
| `--url` [url]       | Webhook to be called after building the app.                                                                            |
| `--event` [type]    | The type of webhook: [build].                                                                                           |
| `--secret` [secret] | Secret to be used to calculate the webhook request payload signature. See docs for more details. Must be 16 chars long. |
| `--config` [path]   | Specify a path to app.json.                                                                                             |

</p>
</details>

<details><summary><h3>expo whoami</h3><p>Checks with the server to see if you are logged in and if you are, returns what Expo account you are logged in as.
</p></summary>

</details>

## Global command flags

These options will work with any command, eg: `expo build:ios --help` will provide help information relevant to the `expo build:ios` command.

| Option                    | Description                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `--help`, `-h`            | Reveals usage information.                                                                                          |
| `-o`, `--output` [format] | The output format [pretty or raw]. The default is pretty.                                                           |
| `--non-interactive`       | Fails the command if an interactive prompt would be required to continue. Enabled by default if stdin is not a TTY. |
