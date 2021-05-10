---
title: Using local credentials
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

You can usually get away with not being a code signing expert by [letting EAS handle it for you](managed-credentials.md). However, there are cases where some users might want to manage their project keystore, certificates and profiles on their own.

If you would like to manage your own app signing credentials, you can use `credentials.json` to give EAS Build relative paths to the credentials on your local filesystem and their associated passwords in order to use them to sign your builds.

## credentials.json

If you opt in to local credentials configuration, you'll need to create a `credentials.json` file at the root of your project and it should look something like this:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/keystores/release.keystore",
      "keystorePassword": "paofohlooZ9e",
      "keyAlias": "keyalias",
      "keyPassword": "aew1Geuthoev"
    }
  },
  "ios": {
    "provisioningProfilePath": "ios/certs/profile.mobileprovision",
    "distributionCertificate": {
      "path": "ios/certs/dist-cert.p12",
      "password": "iex3shi9Lohl"
    }
  },
  "experimental": {
    "npmToken": "VALUE"
  }
}
```

> Remember to add `credentials.json` and all of your credentials to `.gitignore` so you don't accidentally commit them to the repository and potentially leak your secrets.

### Android credentials

If you want to build an Android app binary you'll need to have a keystore. If you don't have a release keystore yet, you can generate it on your own using the following command (replace `KEYSTORE_PASSWORD`, `KEY_PASSWORD`, `KEY_ALIAS` and `com.expo.your.android.package` with the values of your choice):

```sh
keytool \\
 -genkey -v \\
 -storetype JKS \\
 -keyalg RSA \\
 -keysize 2048 \\
 -validity 10000 \\
 -storepass KEYSTORE_PASSWORD \\
 -keypass KEY_PASSWORD \\
 -alias KEY_ALIAS \\
 -keystore release.keystore \\
 -dname "CN=com.expo.your.android.package,OU=,O=,L=,S=,C=US"
```

Once you have the keystore file on your computer, you should move it to the appropriate directory. We recommend you keep your keystores in the `android/keystores` directory. **Remember to gitignore all your release keystores!** If you've run the above keytool command and placed the keystore at `android/keystores/release.keystore`, you can ignore that file by adding the following line to `.gitignore`:

```
android/keystores/release.keystore
```

Create `credentials.json` and configure it with the credentials:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/keystores/release.keystore",
      "keystorePassword": "KEYSTORE_PASSWORD",
      "keyAlias": "KEY_ALIAS",
      "keyPassword": "KEY_PASSWORD"
    }
  }
}
```

- `keystorePath` points to where the keystore is located on your computer. Both relative (to the project root) and absolute paths are supported.
- `keystorePassword` is the keystore password. If you've followed the previous steps it's the value of `KEYSTORE_PASSWORD`.
- `keyAlias` is the key alias. If you've followed the previous steps it's the value of `KEY_ALIAS`.
- `keyPassword` is the key password. If you've followed the previous steps it's the value of `KEY_PASSWORD`.

### iOS Credentials

There are a few more prerequisites for building the iOS app binary. You need a paid Apple Developer Account, and then you'll need to generate the Distribution Certificate and Provisioning Profile for your application, which can be done via the [Apple Developer portal](https://developer.apple.com/account/resources/certificates/list).

Once you have the Distribution Certificate and Provisioning Profile on your computer, you should move them to the appropriate directory. We recommend you keep them in the `ios/certs` directory. In the rest of this document we assume that they are named `dist.p12` and `profile.mobileprovision` respectively. **Remember to gitignore all files in the directory!** If you've placed the credentials in the suggested directory, you can ignore those files by adding the following line to `.gitignore`:

```
ios/certs/*
```

Create (or edit) `credentials.json` and configure it with the credentials:

```json
{
  "android": {
    ...
  },
  "ios": {
    "provisioningProfilePath": "ios/certs/profile.mobileprovision",
    "distributionCertificate": {
      "path": "ios/certs/dist.p12",
      "password": "DISTRIBUTION_CERTIFICATE_PASSWORD"
    }
  }
}
```

- `provisioningProfilePath` points to where the Provisioning Profile is located on your computer. Both relative (to the project root) and absolute paths are supported.
- `distributionCertificate.path` points to where the Distribution Certificate is located on your computer. Both relative (to the project root) and absolute paths are supported.
- `distributionCertificate.password` is the password for the Distribution Certificate located at `distributionCertificate.path`.

#### Multi-target project

> 👉 **Currently, building multi-target iOS projects is only supported via `credentials.json`. Managing multiple sets of credentials for multi-target projects will be available in EAS CLI in the future.**

If your iOS app is using [App Extensions](https://developer.apple.com/app-extensions/) like Share Extension, Widget Extension, and so on, you need to provide credentials for every target of the Xcode project. This is necessary because each extension is identified by an individual bundle identifier.

Let's say that your project consists of a main application target (named `multitarget`) and a Share Extension target (named `shareextension`).

<ImageSpotlight alt="Xcode multi target configuration" src="/static/images/eas-build/multi-target.png" style={{maxWidth: 360}} />

In this case your `credentials.json` should like like this:

```json
{
  "ios": {
    "multitarget": {
      "provisioningProfilePath": "ios/certs/multitarget-profile.mobileprovision",
      "distributionCertificate": {
        "path": "ios/certs/dist.p12",
        "password": "DISTRIBUTION_CERTIFICATE_PASSWORD"
      }
    },
    "shareextension": {
      "provisioningProfilePath": "ios/certs/shareextension-profile.mobileprovision",
      /* @info You can use either the same distribution certificate (as for the first target) or a new one */ "distributionCertificate": {
        "path": "ios/certs/another-dist.p12",
        "password": "ANOTHER_DISTRIBUTION_CERTIFICATE_PASSWORD"
      } /* @end */

    }
  }
}
```

## Setting a credentials source (optional)

You can tell EAS Build how it should resolve credentials by specifying `"credentialsSource": "local"` or `"credentialsSource:" "remote"` on a build profile.

- If `"local"` is provided, then `credentials.json` will always be used.
- If `"remote"` is provided, then credentials will always be resolved from EAS servers.

For example, maybe you want to use local credentials when deploying to the Amazon Appstore and remote credentials when deploying to the Google Play Store:

```json
{
  "builds": {
    "android": {
      "amazon": {
        "workflow": "generic",
        "credentialsSource": "local"
      },
      "google": {
        "workflow": "generic",
        "credentialsSource": "remote"
      }
    }
  }
}
```

If credentials are not available at the given source and `eas build` has been run with the `--non-interactive` flag, the command will error. If you know that you always want to use local credentials for a particular profile, we encourage you to set this option.

If you do not set any option, `"credentialsSource"` will default to `"auto"`.

### Automatic credentials resolution (default)

Let's assume we're building only for Android and using the following configuration (defined in `eas.json` - [learn more about using the `eas.json` file](/build/eas-json.md)):

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic"
      }
    }
  }
}
```

Given this configuration, `eas build --platform android` will resolve the credentials using the so-called **auto mode**.

The algorithm of the auto mode works like this:

- If the entry for a given platform in `credentials.json` is defined and the project's credentials exist on the EAS servers:
  - Check if the local credentials match the remote credentials, and if so - use the local credentials.
  - Otherwise, display a prompt to ask which credentials should be used.
- If the entry for a given platform in `credentials.json` is defined but the project's credentials do **not** exist on the EAS servers - use the credentials defined in `credentials.json`.
- If the entry for a given platform in `credentials.json` is **not** defined but the project's credentials exist on the EAS servers - use the credentials from the EAS servers.
- If neither the entry for a given platform in `credentials.json` is defined nor remote credentials exist - display a prompt to ask whether new credentials should be generated and stored on the EAS servers.

## Using local credentials on builds triggered from CI

Before you start setting up your CI job, make sure you have your `credentials.json` and `eas.json` files configured [as described above](#credentialsjson).

We are going to pass in `credentials.json` as a secret, and developers tend to provide CI jobs with secrets by using environment variables. One of the challenges with this approach is that the `credentials.json` file contains a JSON object and it might be difficult to escape it properly, so you could assign it to an environment variable. One possible solution to this problem is to convert the file to a base64-encoded string, set an environment variable to that value, and later decode it and restore the file on the CI.

Consider the following steps:

- Run `base64 credentials.json` in the console.
- On your CI, set the `CREDENTIALS_JSON_BASE64` environment variable with the output of the above command.
- In the CI job, restore the file using a simple shell command:
  ```sh
  echo $CREDENTIALS_JSON_BASE64 | base64 -d > credentials.json
  ```

Similarly, you can encode your keystore, provisioning profile and distribution certificate so you can restore them later on the CI. In order to successfully trigger your build using local credentials from CI, you'll have to make sure all the credentials exist in the CI instance's file system (at the same locations as defined in `credentials.json`).

Once the restoring steps are in place, you can use the same process described in the [Triggering builds from CI](/build/building-on-ci.md) guide to trigger the builds.
