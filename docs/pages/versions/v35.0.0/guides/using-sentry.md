---
title: Using Sentry
---

[Sentry](http://getsentry.com/) is a crash reporting and aggregation platform that provides you with "real-time insight into production deployments with info to reproduce and fix crashes".

It notifies you of exceptions that your users run into while using your app and organizes for you to triage from their web dashboard. Reported exceptions include sourcemapped stacktraces and other relevant context (device id, platform, Expo version, etc.) automatically; you can also provide other context that is specific to your application, like the current route and user id.

## Why Sentry?

- Sentry treats React Native as a first-class citizen and we have collaborated with Sentry to make sure Expo is too.
- It's easy to set up and use.
- It scales to meet the demands of even the largest projects.
- It works on most platforms, so you can use the same service for reporting your server, CLI, or desktop app errors as you use for your Expo app.
- We trust it for our projects at Expo.
- It is free for up to 5,000 events per month.

## Add Sentry to your Expo project

### Sign up for a Sentry account and create a project

- [Sign up for a Sentry account](https://sentry.io/signup/)
- Once you have signed up, you will be prompted to create a project. Enter the name of your project and continue.
- Copy your "DSN", you will need it shortly.
- Go to the [Sentry API](https://sentry.io/api/) section and create an auth token. You can use the default configuration, this token will never be made available to users of your app. Ensure you have `project:write` selected under scopes. Copy your auth token and save it for later.
- Go to your project dashboard by going to [sentry.io](https://sentry.io) and selecting your project. Next go to the settings tab and copy the name of your project, we will need this. The "legacy name" will not work for our purposes.
- Go to your organization settings by going to [sentry.io](https://sentry.io), press the button in the top left of your screen with the arrow beside it and select "organization settings". Copy the name of your organization. The "legacy name" will not work for our purposes.

### Install and configure Sentry

- Make sure you're using a new version of Node which supports async/await (Node 7.6+)
- In your project, install the Expo integration: `npm i sentry-expo --save`
- Add the following in your app's main file (`App.js` by default).

```javascript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'DSN',
  enableInExpoDevelopment: true,
  debug: true
});
```

- Open `app.json` and add a `postPublish hook`:

```json
{
  "expo": {
    // ... your existing configuration

    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your organization's short name here",
            "project": "your project name here",
            "authToken": "your auth token here",
            "url": "your sentry url here" // OPTIONAL- only necessary when self-hosting Sentry
          }
        }
      ]
    }
  }
}
```

The correct `authToken` value can be generated from the [Sentry API page ](https://sentry.io/settings/account/api/).

> You can also use environment variables for your config, if you prefer:
>
> - organization = SENTRY_ORG
> - project = SENTRY_PROJECT
> - authToken = SENTRY_AUTH_TOKEN
> - (optional) url = SENTRY_URL

### Publish your app with sourcemaps

With the `postPublish` hook in place, now all you need to do is hit publish and the sourcemaps will be uploaded automatically. We automatically assign a unique release version for Sentry each time you hit publish, based on the version you specify in `app.json` and a release id on our backend -- this means that if you forget to update the version but hit publish, you will still get a unique Sentry release. If you're not familiar with publishing on Expo, you can [read more about it here](../../workflow/publishing/).

In order to use the published release source maps with Issues in Sentry, you'll have to set your Expo `revisionId` as the Sentry release identifier, like so:

```javascript
// e.g. in your `App.js`
import Constants from 'expo-constants';

// ... initialize Sentry first

Sentry.setRelease(Constants.manifest.revisionId);
```

Note that the `revisionId` is not available in the manifest when running in development mode (using Expo CLI), defaulting to `undefined`.

## Error reporting semantics

In order to ensure that errors are reported reliably, Sentry defers reporting the data to their backend until the next time you load the app after a fatal error rather than trying to report it upon catching the exception. It saves the stacktrace and other metadata to `AsyncStorage` and sends it immediately when the app starts.

## Disabled by default in dev

Unless `enableInExpoDevelopment: true` is set, all your dev/local errors will be ignored and only app releases will report errors to Sentry. You can call methods like `Sentry.captureException(new Error('Oops!'))` but these methods will be no-op.

## Learn more about Sentry

Sentry does more than just catch fatal errors, learn more about how to use Sentry from their [JavaScript usage docs](https://docs.sentry.io/platforms/javascript/).
