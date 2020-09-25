---
title: Using Sentry
---

[Sentry](http://getsentry.com/) is a crash reporting platform that provides you with "real-time insight into production deployments with info to reproduce and fix crashes".

It notifies you of exceptions or errors that your users run into while using your app, and organizes them for you on a web dashboard. Reported exceptions include stacktraces, device info, version, and other relevant context automatically; you can also provide additional context that is specific to your application, like the current route and user id.

## Why Sentry?

- Sentry treats React Native as a first-class citizen and we have collaborated with Sentry to make sure Expo is, too.
- It's very easy to set up and use
- It scales to meet the demands of even the largest projects.
- We trust it for our projects at Expo.
- It is free for up to 5,000 events per month.

> Note: Native crash reporting is not available with `sentry-expo` in the managed workflow.

## How to add Sentry to your Expo project

### Sign up for a Sentry account and create a project

Before getting real-time updates on errors and making your app generally incredible, you'll need to make sure you've created a Sentry project. Here's how to do that:

1. [Sign up for Sentry](https://sentry.io/signup/) (it's free), and create a project in your Dashboard. Take note of your **organization name**, **project name**, and **`DSN`**; you'll need them later.

   - **organization name** is available in your `Organization settings` tab
   - **project name** is available in your project's `Settings` > `General Settings` tab
   - **`DSN`** is avalable in your project's `Settings` > `Client Keys` tab

2. Go to the [Sentry API section](https://sentry.io/settings/account/api/auth-tokens/), and create an **auth token** (Ensure you have `project:write` selected under scopes). Save this, too.

Once you have each of these: organization name, project name, DSN, and auth token, you're all set!

### Install and configure Sentry

- In your project, install the Expo integration: `yarn add sentry-expo` or `npm i sentry-expo`
- Add the following in your app's main file (usually `App.js`):

```javascript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR DSN HERE',
  enableInExpoDevelopment: true,
  debug: true, // Sentry will try to print out useful debugging information if something goes wrong with sending an event. Set this to `false` in production.
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
            "organization": "your sentry organization's short name here",
            "project": "your sentry project's name here",
            "authToken": "your auth token here"
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
>
> You can pass them in directly like this:
>
> ```
> SENTRY_PROJECT=myCoolProject expo publish
> ```

#### Additional config options

In addition to the required config fields above, you can also provide these **optional** fields:

- `setCommits` : boolean value indicating whether or not to tell Sentry about which commits are associated with a new release. This allows Sentry to pinpoint which commits likely caused an issue.
- `deployEnv` : string indicating the deploy environment. This will automatically send an email to Sentry users who have committed to the release that is being deployed.
- `release` : The name you'd like to give your release (e.g. `release-feature-ABC`). This defaults to a unique `revisionId` of your JS bundle.
  - **Important**: If you provide a custom `release`, you must pass in the same `release` value to `Sentry.init` OR call `Sentry.setRelease(release)` after initialization, otherwise you will not see stacktraces in your error reports.
- `url` : your Sentry URL, only necessary when self-hosting Sentry.

> You can also use environment variables for your config, if you prefer:
>
> - setCommits = SENTRY_SET_COMMITS
> - deployEnv = SENTRY_DEPLOY_ENV
> - release = SENTRY_RELEASE
> - url = SENTRY_URL

### Publish your app with sourcemaps

With the `postPublish` hook in place, now all you need to do is run `expo publish` and the sourcemaps will be uploaded automatically. We automatically assign a unique release version for Sentry each time you hit publish, based on the version you specify in `app.json` and a release id on our backend -- this means that if you forget to update the version but hit publish, you will still get a unique Sentry release. If you're not familiar with publishing on Expo, you can [read more about it here](../../workflow/publishing/).

### Testing Sentry

If you're using `Jest`, make sure to add `@sentry/.*` and `sentry-expo` to your `transformIgnorePatterns`.

## Error reporting semantics

In order to ensure that errors are reported reliably, Sentry defers reporting the data to their backend until the next time you load the app after a fatal error rather than trying to report it upon catching the exception. It saves the stacktrace and other metadata to `AsyncStorage` and sends it immediately when the app starts.

## Disabled by default in dev

Unless `enableInExpoDevelopment: true` is set, all your dev/local errors will be ignored and only app releases will report errors to Sentry. You can call methods like `Sentry.captureException(new Error('Oops!'))` but these methods will be no-op.

## Learn more about Sentry

Sentry does more than just catch fatal errors, learn more about how to use Sentry from their [JavaScript usage docs](https://docs.sentry.io/platforms/javascript/).
