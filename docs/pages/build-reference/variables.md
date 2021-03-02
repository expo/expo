---
title: Environment variables and secrets
---

The ["Environment variables in Expo"](/guides/environment-variables.md) guide presents several options for how you can access system environment variables to your app JavaScript code. This can be a useful way to inject values in your code, but [these values should not be secrets](/guides/environment-variables.md#security-considerations), and so the value it provides can be summarized as a convenience for accommodating certain development workflows.

Using the techniques described in the environment variables document above, environment variables are inlined (the `process.env.X` text is replaced with it's evaluated result) in your app's JavaScript code _at the the time that the app is built_, and included in the app bundle. This means that the substitution would occur on EAS Build servers and not on your development machine, so if you tried to run a build on EAS Build without explicitly providing values or fallbacks for the environment variables, then you are likely encounter either a build-time or runtime error.

## Using plaintext environment variables

Plaintext environment variables are strings that you are comfortable with committing to your source control and using inside of your client app code. For example, you might use an `API_URL` variable to tell your app what backend to use.

You can specify environment variables for specific build jobs using `eas.json`:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic",
        "env": {
          "API_URL": "https://api.production.com"
        }
      }
    },
    "ios": {
      "release": {
        "workflow": "generic",
        "env": {
          "API_URL": "https://api.production.com"
        }
      }
    }
  }
}
```

You can access these variables in your application using the techniques described in the ["Environment variables in Expo"](/guides/environment-variables.md) guide. You can also share common configuration between different build profiles using the `"extends"` property:

```json
{
  "builds": {
    "ios": {
      "release": {
        "workflow": "generic",
        "env": {
          "API_URL": "https://api.production.com"
        }
      },
      "test": {
        "workflow": "generic",
        "distribution": "internal",
        "extends": "release"
      }
    }
  }
}
```

See the [eas.json reference](/build/eas-json.md) for more information.

## Using secrets in environment variables

For values that you want to expose to your EAS Build hooks but are too sensitive to include in your source code, you can use our Secrets feature found on the Expo website.

These secrets are encrypted at rest and in transit, and are only decrypted in a secure environment by EAS servers.

You can create up to 100 account-wide and app-specific secrets. Account-wide, or "global" secrets will be exposed to every build environment across all of your apps. App-specific secrets only apply to the app they're defined on, and override global secrets with the same name.

### Linking source code to EAS

<!-- TODO: either implement `eas link` or add this to `eas build:configure` -->

To set up secrets for your app, you need to first link your source code to a matching app identifier on our servers.

You can do this using the `eas link` command inside your project directory.

### Finding the secrets UI

To create secrets to use across all apps in an account, you can navigate to the "Secrets" tab under the account settings:

![Global secrets location](/static/images/eas-build/environment-secrets/secrets-account-nav.png)

To create secrets to in a specific app, you can navigate to the "Secrets" tab under the app dashboard:

![App secrets location](/static/images/eas-build/environment-secrets/secrets-project-nav.png)

### Adding secrets

When setting up secrets for a new account or app, you'll be met with this UI:

![Empty secrets UI](/static/images/eas-build/environment-secrets/secrets-empty.png)

Click the "Create" button in the top-right of the table to create a new secret.

A secret needs a name and a value. The name can only contain alphanumeric characters and underscores:

![Secret creation UI filled](/static/images/eas-build/environment-secrets/secrets-create-filled.png)

![Secret UI with stored secret](/static/images/eas-build/environment-secrets/secrets-populated.png)

After creating a secret, you can access the value via EAS Build hooks in Node.JS as `process.env.VARIABLE_NAME` or in shell scripts as `$VARIABLE_NAME`:

```json
// package.json
{
  "scripts": {
    "eas-build-pre-install": "echo $VARIABLE_NAME",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "web": "expo start --web",
    "start": "react-native start",
    "test": "jest"
  },
 ...
}
```

Learn more about EAS Build hooks [here](/build-reference/how-tos/#eas-build-specific-npm-hooks).

## Built-in environment variables

The following environment variables are exposed to each build job:

- `CI=1` - indicates this is a CI environment
- `EAS_BUILD=1` - indicates this is an EAS Build environment
- `EAS_BUILD_PROFILE` - the name of the build profile from `eas.json`, e.g. `release`
- `EAS_BUILD_GIT_COMMIT_HASH` - the hash of the Git commit, e.g. `88f28ab5ea39108ade978de2d0d1adeedf0ece76`
- `EAS_BUILD_NPM_CACHE_URL` - the URL of the npm cache ([learn more](how-tos.md#using-npm-cache-with-yarn-v1))
