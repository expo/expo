---
title: Using Sentry
maxHeadingDepth: 4
---

import { ConfigReactNative, ConfigClassic } from '~/components/plugins/ConfigSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

[Sentry](http://getsentry.com/) is a crash reporting platform that provides you with "real-time insight into production deployments with info to reproduce and fix crashes".

It notifies you of exceptions or errors that your users run into while using your app, and organizes them for you on a web dashboard. Reported exceptions include stacktraces, device info, version, and other relevant context automatically; you can also provide additional context that is specific to your application, like the current route and user id.

## Why sentry-expo?

- Sentry treats React Native as a first-class citizen and we have collaborated with Sentry to make sure Expo is, too.
- It's very easy to set up and use
- It scales to meet the demands of even the largest projects.
- We trust it for our projects at Expo.
- It is free for up to 5,000 events per month.
- It streamlines your error-reporting code across iOS, Android, and web

> Note: Native crash reporting is not available with the classic build system (`expo build:[ios|android]`), but is available via EAS Build.

<PlatformsSection title="Platform compatibility" android emulator ios simulator web />

## Installating and configuring Sentry

### Step 0: Sign up for a Sentry account and create a project

Before getting real-time updates on errors and making your app generally incredible, you'll need to make sure you've created a Sentry project. Here's how to do that:

1. [Sign up for Sentry](https://sentry.io/signup/) (it's free), and create a project in your Dashboard. Take note of your **organization name**, **project name**, and **`DSN`**; you'll need them later.

   - **organization name** is available in your `Organization settings` tab
   - **project name** is available in your project's `Settings` > `Projects` tab (find it in the list)
   - **`DSN`** is avalable in your project's `Settings` > `Projects` > **Project name** > `Client Keys (DSN)` tab

2. Go to the [Sentry API section](https://sentry.io/settings/account/api/auth-tokens/), and create an **auth token**. The token requires the scopes: `org:read`, `project:releases`, and `project:write`. Save this, too.

Once you have each of these: organization name, project name, DSN, and auth token, you're all set!

### Step 1: Installation

In your project directory, run:

<Terminal cmd={['$ npx expo install sentry-expo']} />

`sentry-expo` also requires some additional Expo module packages. To install them, run:

<Terminal
cmd={['$ npx expo install expo-application expo-constants expo-device expo-updates @sentry/react-native']}
/>

### Step 2: Code

#### Initialization

Add the following to your app's main file such as **App.js**:

```js
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR DSN HERE',
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});
```

#### Usage

Depending on which platform you are on (mobile or web), use the following methods to access any `@sentry/*` methods for instrumentation, performance, capturing exceptions and so on:

- For React Native, access any `@sentry/react-native` exports with `Sentry.Native.*`
- For web, access any `@sentry/browser` exports with `Sentry.Browser.*`

```js
// Access any @sentry/react-native exports via:
// Sentry.Native.*

// Access any @sentry/browser exports via:
// Sentry.Browser.*

// The following example uses `captureException()` from Sentry.Native.* to capture errors:
try {
  // your code
} catch (error) {
  Sentry.Native.captureException(error);
}
```

### Step 3: App Configuration

Configuring sentry-expo is done through the config plugin in your **app.json** or **app.config.js**.

<ConfigClassic>

The instructions below will still apply, with the exception of the `plugin` configuration. Config plugins have no effect when using the classic build system.

</ConfigClassic>

<ConfigReactNative>

If you use bare workflow, **you should not use the `plugins` property in app.json**. Instead, use `yarn sentry-wizard -i reactNative -p ios android` to configure your native projects. This `sentry-wizard` command will add an extra:

```js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR DSN',
});
```

to your root project file (usually **App.js**), so make sure you remove it (but keep the `sentry-expo` import and original `Sentry.init` call!)

</ConfigReactNative>

#### 3.1: Configure a `postPublish` hook

Add `expo.hooks` to your project's `app.json` (or `app.config.js`) file:

```json
{
  "expo": {
    // ... your existing configuration
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your sentry organization slug here",
            "project": "your sentry project name here",
            "authToken": "your auth token here"
          }
        }
      ]
    }
  }
}
```

The `authToken` value can be generated from the [Sentry API page](https://sentry.io/settings/account/api/).


<Collapsible summary="Prefer to use environment variables instead of storing values in app.json?">

You can also use environment variables for your config, if you prefer:

- organization → `SENTRY_ORG`
- project → `SENTRY_PROJECT`
- authToken → `SENTRY_AUTH_TOKEN`

</Collapsible>


<Collapsible summary="Additional configuration options">

In addition to the required config fields above, you can also provide these **optional** fields:

- `setCommits` : boolean value indicating whether or not to tell Sentry about which commits are associated with a new release. This allows Sentry to pinpoint which commits likely caused an issue.
- `deployEnv` : string indicating the deploy environment. This will automatically send an email to Sentry users who have committed to the release that is being deployed.
- `distribution` : The name/value to give your distribution (you can think of this as a sub-release). Expo defaults to using your `version` from app.json. **If you provide a custom `distribution`, you must pass the same value to `dist` in your call to `Sentry.init()`, otherwise you will not see stacktraces in your error reports.**
- `release` : The name you'd like to give your release (e.g. `release-feature-ABC`). This defaults to a unique `revisionId` of your JS bundle. **If you provide a custom `release`, you must pass in the same `release` value to `Sentry.init()`, otherwise you will not see stacktraces in your error reports.**
- `url` : your Sentry URL, only necessary when self-hosting Sentry.

> You can also use environment variables for your config, if you prefer:
>
> - setCommits → `SENTRY_SET_COMMITS`
> - deployEnv → `SENTRY_DEPLOY_ENV`
> - distribution → `SENTRY_DIST`
> - release → `SENTRY_RELEASE`
> - url → `SENTRY_URL`

</Collapsible>

#### 3.2: Add the Config Plugin

Add `expo.plugins` to your project's `app.json` (or `app.config.js`) file:

```json
{
  "expo": {
    // ... your existing configuration
    "plugins": ["sentry-expo"]
  }
}
```

## Sourcemaps

{/* TODO: Drop `expo publish` mention */}

With the `postPublish` hook in place, now all you need to do is run `expo publish` and the sourcemaps will be uploaded automatically. We automatically assign a unique release version for Sentry each time you hit publish, based on the version you specify in **app.json** and a release id on our backend -- this means that if you forget to update the version but hit publish, you will still get a unique Sentry release.

> This hook can also be used as a `postExport` hook if you're [self-hosting your updates](../distribution/custom-updates-server.md).

### Uploading sourcemaps at build time

> Note: Disregard the following if you're using the classic build system (`expo build:[android|ios]`).

With `expo-updates`, release builds of both iOS and Android apps will create and embed a new update from your JavaScript source at build-time. **This new update will not be published automatically** and will exist only in the binary with which it was bundled. Since it isn't published, the sourcemaps aren't uploaded in the usual way like they are when you run `expo publish` (actually, we are relying on Sentry's native scripts to handle that). Because of this you have some extra things to be aware of:

- Your `release` will automatically be set to Sentry's expected value- `${bundleIdentifier}@${version}+${buildNumber}` (iOS) or `${androidPackage}@${version}+${versionCode}` (Android).
- Your `dist` will automatically be set to Sentry's expected value: `${buildNumber}` (iOS) or `${versionCode}` (Android).
- The configuration for build time sourcemaps comes from the `ios/sentry.properties` and `android/sentry.properties` files. For more information, refer to [Sentry's documentation](https://docs.sentry.io/clients/java/config/#configuration-via-properties-file). Manual configuration is only required for bare projects, the [sentry-expo config plugin handles it otherwise](#add-the-config-plugin).
- Configuration for `expo publish` and `npx expo export` for projects is done via `app.json`, whether using bare workflow or not.

Skipping or misconfiguring either of these can lead to invalid sourcemaps, and you won't see human readable stacktraces in your errors.

### Self-hosting updates

If you're self-hosting your updates (this means you run `npx expo export` instead of `expo publish`), you need to:

- replace `hooks.postPublish` in your **app.json** file with `hooks.postExport` (everything else stays the same)
- add the `RewriteFrames` integration to your `Sentry.init` call like so:

```js
Sentry.init({
  dsn: SENTRY_DSN,
  enableInExpoDevelopment: true,
  integrations: [
    new RewriteFrames({
      iteratee: frame => {
        if (frame.filename) {
          // the values depend on what names you give the bundle files you are uploading to Sentry
          frame.filename =
            Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
        }
        return frame;
      },
    }),
  ],
});
```

### Testing Sentry

When building tests for your application, you want to assert that the right flow-tracking or error is being sent to Sentry, but without really sending it to Sentry servers. This way you won't swamp Sentry with false reports during test running and other CI operations.

[`sentry-testkit`](https://wix.github.io/sentry-testkit) enables Sentry to work natively in your application, and by overriding the default Sentry transport mechanism, the report is not really sent but rather logged locally into memory. In this way, the logged reports can be fetched later for your own usage, verification, or any other use you may have in your local developing/testing environment.

See how to get started with `sentry-testkit` in their [documentation site here](https://wix.github.io/sentry-testkit/)

> If you're using `jest`, make sure to add `@sentry/.*` and `sentry-expo` to your `transformIgnorePatterns`.

## Error reporting semantics

In order to ensure that errors are reported reliably, Sentry defers reporting the data to their backend until the next time you load the app after a fatal error rather than trying to report it upon catching the exception. It saves the stacktrace and other metadata to `AsyncStorage` and sends it immediately when the app starts.

## Disabled by default in dev

Unless `enableInExpoDevelopment: true` is set, all your dev/local errors will be ignored and only app releases will report errors to Sentry. You can call methods like `Sentry.Native.captureException(new Error('Oops!'))` but these methods will be no-op.

## Learn more about Sentry

Sentry does more than just catch fatal errors, learn more about how to use Sentry from their [JavaScript usage docs](https://docs.sentry.io/platforms/javascript/).
