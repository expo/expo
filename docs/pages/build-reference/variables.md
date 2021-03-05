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

🚧 We are currently working on a secrets API that will allow developers to store generic encrypted secrets and selectively expose them to build jobs. This feature will be available before EAS Build graduates from preview.

App signing credentials secrets are stored in `credentials.json`, which should not be committed to git. This file can also be used to set the `NPM_TOKEN` environment variable in order to give you access to your organization's private packages. [Learn more](how-tos.md).

## Built-in environment variables

The following environment variables are exposed to each build job:

- `CI=1` - indicates this is a CI environment
- `EAS_BUILD=1` - indicates this is an EAS Build environment
- `EAS_BUILD_PROFILE` - the name of the build profile from eas.json, e.g. `release`
- `EAS_BUILD_GIT_COMMIT_HASH` - the hash of the Git commit, e.g. `88f28ab5ea39108ade978de2d0d1adeedf0ece76`
- `EAS_BUILD_NPM_CACHE_URL` - the URL of the npm cache ([learn more](how-tos.md#using-npm-cache-with-yarn-v1))
