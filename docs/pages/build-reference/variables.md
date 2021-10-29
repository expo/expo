---
title: Environment variables and secrets
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

The ["Environment variables in Expo"](/guides/environment-variables.md) guide presents several options for how you can access system environment variables to your app JavaScript code. This can be a useful way to inject values in your code, but [these values should not be secrets](/guides/environment-variables.md#security-considerations), and so the value it provides can be summarized as a convenience for accommodating certain development workflows.

Using the techniques described in the environment variables document above, environment variables are inlined (the `process.env.X` text is replaced with its evaluated result) in your app's JavaScript code _at the the time that the app is built_, and included in the app bundle. This means that the substitution would occur on EAS Build servers and not on your development machine, so if you tried to run a build on EAS Build without explicitly providing values or fallbacks for the environment variables, then you are likely to encounter either a build-time or runtime error.

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

## Using secrets in environment variables

To provide your build jobs with access to values that are too sensitive to include in your source code and git repository, you can use "Secrets".

These secrets are encrypted at rest and in transit, and are only decrypted in a secure environment by EAS servers.

You can create up to 100 account-wide secrets for each Expo account and 100 app-specific secrets for each app (you probably won't need that many). Account-wide secrets will be exposed to every build environment across all of your apps. App-specific secrets only apply to the app they're defined for, and will override any account-wide secrets with the same name.

You can manage secrets through the Expo website and EAS CLI.

### Secrets on the Expo website

To create account-wide secrets, navigate to the "Secrets" tab under your account or organization's [settings](https://expo.dev/settings/secrets):

<ImageSpotlight alt="account-wide secrets location" src="/static/images/eas-build/environment-secrets/secrets-account-nav.png" />

To create app-specific secrets, navigate to the "Secrets" tab in the project dashboard:

<ImageSpotlight alt="Project secrets location" src="/static/images/eas-build/environment-secrets/secrets-project-nav.png" />

If you haven't published your project yet and it isn't visible on the website, create one on the project list page.

<ImageSpotlight alt="Create project button location" src="/static/images/eas-build/environment-secrets/project-creation-navigation.png" />

<ImageSpotlight alt="Create project UI" src="/static/images/eas-build/environment-secrets/project-creation-web.png" />

### Adding secrets with the website

When setting up secrets for a new account or app, you'll be met with this UI:

<ImageSpotlight alt="Empty secrets UI" src="/static/images/eas-build/environment-secrets/secrets-empty.png" />

Click the "Create" button in the top-right of the table to create a new secret.

A secret needs a name and a value. The name can only contain alphanumeric characters and underscores:

<ImageSpotlight alt="Secret creation UI filled" src="/static/images/eas-build/environment-secrets/secrets-create-filled.png" />

<ImageSpotlight alt="Secret UI with stored secret" src="/static/images/eas-build/environment-secrets/secrets-populated.png" />

### Adding secrets with EAS CLI

To create a new secret, run `eas secret:create`

```
> eas secret:create project SECRET_NAME secretvalue
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

After creating a secret, you can access the value via EAS Build hooks in Node.js as `process.env.VARIABLE_NAME` or in shell scripts as `$VARIABLE_NAME`:

```json
// package.json
{
  "scripts": {
    "eas-build-pre-install": "echo $VARIABLE_NAME",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "start": "react-native start",
    "test": "jest"
  }
}
```

[Learn more about EAS Build hooks](/build-reference/how-tos/#eas-build-specific-npm-hooks).

## Built-in environment variables

The following environment variables are exposed to each build job:

- `CI=1` - indicates this is a CI environment
- `EAS_BUILD=true` - indicates this is an EAS Build environment
- `EAS_BUILD_ID` - the build ID, e.g. `f51831f0-ea30-406a-8c5f-f8e1cc57d39c`
- `EAS_BUILD_PROFILE` - the name of the build profile from **eas.json**, e.g. `production`
- `EAS_BUILD_GIT_COMMIT_HASH` - the hash of the Git commit, e.g. `88f28ab5ea39108ade978de2d0d1adeedf0ece76`
- `EAS_BUILD_NPM_CACHE_URL` - the URL of the npm cache ([learn more](/build-reference/private-npm-packages))
- `EAS_BUILD_USERNAME` - the username of the user initiating the build (it's undefined for bot users)
