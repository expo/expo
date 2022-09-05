---
title: Environment variables and secrets
---

import { Collapsible } from '~/ui/components/Collapsible';

The ["Environment variables in Expo"](/guides/environment-variables.md) guide presents several options for how you can access system environment variables to your app JavaScript code. This can be a useful way to inject values in your code, but [these values should not be secrets](/guides/environment-variables.md#security-considerations), and so the value it provides can be summarized as a convenience for accommodating certain development workflows.

Using the techniques described in the environment variables document above, environment variables are inlined (the `process.env.X` text is replaced with its evaluated result) in your app's JavaScript code _at the time that the app is built_, and included in the app bundle. This means that the substitution would occur on EAS Build servers and not on your development machine, so if you tried to run a build on EAS Build without explicitly providing values or fallbacks for the environment variables, then you are likely to encounter either a build-time or runtime error.

## Using plaintext environment variables

Plaintext environment variables are strings that you are comfortable with committing to your source control and using inside of your client app code. For example, you might use an `API_URL` variable to tell your app what backend to use.

You can specify environment variables for specific build jobs using **eas.json**:

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.production.com"
      }
    }
  }
}
```

You can access these variables in your application using the techniques described in the ["Environment variables in Expo"](/guides/environment-variables.md) guide. You can also share common configurations between different build profiles using the `"extends"` property, if both profiles have an `env` object defined, content will be merged.

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.production.com"
      }
    },
    "test": {
      "distribution": "internal",
      "extends": "production"
    }
  }
}
```

See the [eas.json reference](/build/eas-json.md) for more information.

## Environment variables and app.config.js

Environment variables used in your build profile will also be used to evaluate **app.config.js** when you run `eas build`. This is important in order to ensure that the result of evaluating **app.config.js** is the same when it's done locally while initiating the build (in order to gather metadata for the build job) and when it occurs on the remote build worker, for example to configure the project during `npx expo prebuild` or to embed the configuration data in the app.

## Built-in environment variables

The following environment variables are exposed to each build job &mdash; they are not set when evaluating **app.config.js** locally:

- `CI=1` - indicates this is a CI environment
- `EAS_BUILD=true` - indicates this is an EAS Build environment
- `EAS_BUILD_PLATFORM` - either `android` or `ios`
- `EAS_BUILD_RUNNER` - either `eas-build` for EAS Build cloud builds or `local-build-plugin` for [local builds](local-builds)
- `EAS_BUILD_ID` - the build ID, e.g. `f51831f0-ea30-406a-8c5f-f8e1cc57d39c`
- `EAS_BUILD_PROFILE` - the name of the build profile from **eas.json**, e.g. `production`
- `EAS_BUILD_GIT_COMMIT_HASH` - the hash of the Git commit, e.g. `88f28ab5ea39108ade978de2d0d1adeedf0ece76`
- `EAS_BUILD_NPM_CACHE_URL` - the URL of the npm cache ([learn more](/build-reference/private-npm-packages))
- `EAS_BUILD_MAVEN_CACHE_URL` - the URL of Maven cache ([learn more](/build-reference/caching/#android-dependencies))
- `EAS_BUILD_USERNAME` - the username of the user initiating the build (it's undefined for bot users)
- `EAS_BUILD_WORKINGDIR` - the remote directory path with your project

## Using secrets in environment variables

To provide your build jobs with access to values that are too sensitive to include in your source code and Git repository, you can use "Secrets".

A secret is made up of a name and a value. The name can only contain alphanumeric characters and underscores. The value is limited to 32 KiB.

The secret values are encrypted at rest and in transit, and are only decrypted in a secure environment by EAS servers.

You can create up to 100 account-wide secrets for each Expo account and 100 app-specific secrets for each app. Account-wide secrets will be exposed to every build environment across all of your apps. App-specific secrets only apply to the app they're defined for, and will override any account-wide secrets with the same name.

You can manage secrets through the Expo website and EAS CLI.

> ⚠️ Always remember that **anything that is included in your client side code should be considered public and readable to any individual that can run the application**. EAS Secrets are intended to be used to provide values to an EAS Build job so that they may be used during the build process. Examples of correct usage include setting the `NPM_TOKEN` for installing private packages from npm, or a Sentry API key to create a release and upload your sourcemaps to their service. EAS Secrets do not provide any additional security for values that you end up embedding in your application itself, such as an AWS access key or other private keys.

### Secrets on the Expo website

To create **account-wide secrets**, navigate to [the "Secrets" tab in your account or organization settings](https://expo.dev/accounts/[account]/settings/secrets).

To create **app-specific secrets**, navigate to [the "Secrets" tab in your project dashboard](https://expo.dev/accounts/[account]/projects/[project]/secrets). If you haven't published your project yet and it isn't visible on the website, you can create it on the website from this link.

### Adding secrets with EAS CLI

To create a new secret, run `eas secret:create`

```
> eas secret:create --scope project --name SECRET_NAME --value secretvalue
✔ Linked to project @fiberjw/goodweebs
✔ You're inside the project directory. Would you like to use fiberjw account? … yes
✔ ️Created a new secret SECRET_NAME on project @fiberjw/goodweebs.
```

To view any existing secrets for this project, run `eas secret:list`:

```
> eas secret:list
✔ Linked to project @fiberjw/goodweebs
Secrets for this account and project:
┌─────────────────┬─────────┬─────────────────┬──────────────────────────────────────┐
│ Name            │ Target  │ Updated at      │ ID                                   │
├─────────────────┼─────────┼─────────────────┼──────────────────────────────────────┤
│ NPM_TOKEN       │ project │ Mar 11 17:51:36 │ e6625438-d1ed-463b-a143-dd3c2d8f57d6 │
├─────────────────┼─────────┼─────────────────┼──────────────────────────────────────┤
│ sentryApiKey    │ project │ Mar 14 20:57:31 │ f093af84-cc8e-45c0-b969-0e86c724369d │
├─────────────────┼─────────┼─────────────────┼──────────────────────────────────────┤
│ APP_UPLOAD_KEY  │ account │ Mar 14 20:10:52 │ aa08a553-289e-4a6a-9063-8607a4358df5 │
└─────────────────┴─────────┴─────────────────┴──────────────────────────────────────┘
```

### Accessing secrets in EAS Build

After creating a secret, you can read it on subsequent EAS Build jobs with `process.env.VARIABLE_NAME` from Node.js or in shell scripts as `$VARIABLE_NAME`.

## Common questions

Environment variables can be tricky to use if you don't have the correct mental model for how they work. In this section we're going to clarify common sources of confusion, oriented around use cases.

### Can I share environment variables defined in eas.json with `expo start` and `eas update`?

When you define environment variables on build profiles in **eas.json**, they will not be available for local development when you run `npx expo start`. A concern that developers often raise about this is that they now have to duplicate their configuration in multiple places, leading to additional maintenance effort and possible bugs when values go out of sync. If you find yourself in this situation, one possible solution is to move your configuration out of environment variables and into JavaScript. For example, imagine we had the following **eas.json**:

```json
{
  "build": {
    "production": {
      "channel": "production",
      "env": {
        "API_URL": "https://api.production.com",
        "ENABLE_HIDDEN_FEATURES": 0
      }
    },
    "preview": {
      "channel": "staging",
      "env": {
        "API_URL": "https://api.staging.com",
        "ENABLE_HIDDEN_FEATURES": 1
      }
    }
  }
}
```

In **app.config.js**, we may be using the API URL like this:

```js
export default {
  // ...
  extra: {
    // Fall back to development URL when not set
    apiUrl: process.env.API_URL ?? 'https://localhost:3000'
    enableHiddenFeatures: process.env.ENABLE_HIDDEN_FEATURES ? Boolean(process.env.ENABLE_HIDDEN_FEATURES) : true,
  }
}
```

Using this approach, we would always need to remember to run `API_URL=https://api.staging.com ENABLE_HIDDEN_FEATURES=1 eas update` when updating staging, and something similar for production. If we forgot the `ENABLE_HIDDEN_FEATURES=0` flag when publishing to production, we might end up rolling out untested features to production, and if we forgot the `API_URL` value, then users would be pointed to `https://localhost:3000`!

The following are two possible alternative approaches, each with different tradeoffs.

1. **Move values to application code and switch based on channel**. Rather than putting configuration in environment variables and extras, create a JavaScript file, possibly named **Config.js**. This approach will work well for you as long as you don't need to use the configuration values to modify build time configuration, such as the `ios.bundleIdentifier`, `icon`, and so on. This approach also gives you the ability to promote updates between environments, because the configuration that is used will switch when it's loaded from a binary with a different channel. It might look something like this:

  <Collapsible summary="Config.js">

    ```js
    import * as Updates from 'expo-updates';

    let Config = {
      apiUrl: 'https://localhost:3000',
      enableHiddenFeatures: true,
    };

    if (Updates.channel === 'production') {
      Config.apiUrl = 'https://api.production.com';
      Config.enableHiddenFeatures = false;
    } else if (Updates.channel === 'staging') {
      Config.apiUrl = 'https://api.staging.com';
      Config.enableHiddenFeatures = true;
    }

    export default Config;
    ```

  </Collapsible>

2. **Use a single environment variable to toggle configuration**. In our **eas.json** we can set an environment variable such as `APP_ENV` and then switch on that value inside of **app.config.js**. This way, we only have to be sure to set one environment variable: `APP_ENV=production eas update`.

  <Collapsible summary="eas.json">

    ```json
    {
      "build": {
        "production": {
          "channel": "production",
          "env": {
            "APP_ENV": "production"
          }
        },
        "preview": {
          "channel": "staging",
          "env": {
            "APP_ENV": "staging"
          }
        }
      }
    }
    ```

  </Collapsible>

  <Collapsible summary="app.config.js">

    ```js
    let Config = {
      apiUrl: 'https://localhost:3000',
      enableHiddenFeatures: true,
    };

    if (process.env.APP_ENV === 'production') {
      Config.apiUrl = 'https://api.production.com';
      Config.enableHiddenFeatures = false;
    } else if (process.env.APP_ENV === 'staging') {
      Config.apiUrl = 'https://api.staging.com';
      Config.enableHiddenFeatures = true;
    }

    export default {
      // ...
      extra: {
        ...Config,
      },
    };
    ```

  </Collapsible>

### How are naming collisions between secrets and the `env` field in eas.json handled?

A secret created on the Expo website or with `eas secret:create` will take precedence over an environment variable of the same name that is set through the `env` field in **eas.json**.

For example, if you create a secret with name `MY_TOKEN` and value `secret` and also set `"env": { "MY_TOKEN": "public" }` in your **eas.json**, then `process.env.MY_TOKEN` on EAS Build will evaluate to `secret`.

### How do environment variables work for my Expo Development Client builds?

Environment variables set in your build profile that impact **app.config.js** will be used for configuring the development build. When you run `npx expo start` to load your app inside of your development build, only environment variables that are available on your development machine will be used for the app manifest; this becomes the same situation as described above for **expo start**.

### Can I just set my environment variables on a CI provider?

Environment variables must be defined in **eas.json** in order to be made available to EAS Build workers. If you are [triggering builds from CI](/build/building-on-ci.md) this same rule applies, and you should be careful to not confuse setting environment variables on GitHub Actions (or the provider of your choice) with setting environment variables and secrets in **eas.json**.
