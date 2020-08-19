---
title: Advanced credentials configuration
---

In order to build a React Native project for distribution on app stores you will need to provide or generate credentials to sign the app. EAS Build makes managing credentials really easy. When running `expo eas:build` you're guided through the entire credentials management process. Expo CLI will generate both Android and iOS credentials for you, and store them on the Expo servers. This makes it possible to use them for consecutive builds and also speeds up the process of starting new builds of the project for other team members.

Usually, you can get away with not being an expert on credentials and choose Expo to manage them on their servers. However, there are some cases when you want to manage your keystore, certificates and profiles on your own. The most common case is when you want to build your app on CI and so you want to have the full control over which credentials will be used for your builds. Another common case is when you already have your credentials generated from building your app prior to using Expo services. We've introduced a concept of the `credentials.json` file to solve these and similar cases. **Using `credentials.json` is totally optional.**

## credentials.json

The `credentials.json` file should be located at the root of your project, next to `eas.json`. It looks something like this:

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
  }
}
```

It specifies credentials for Android and iOS (but you can configure only one of these platforms if you don't want to build for the other).
**Remember to add `credentials.json` to `.gitignore` so you won't accidentally commit it to the repository (and therefore leak your secrets)**.

## Android Credentials

### Obtaining the Keystore

If you want to build an Android app binary you'll need to have a keystore. If you don't have it yet, you can generate it on your own using the following command (replace `KEYSTORE_PASSWORD`, `KEY_PASSWORD`, `KEY_ALIAS` and `com.expo.your.android.package` with the values of your choice):

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

You can also generate it as a one of the steps in `expo eas:build --platform android`. Remember that this command does not store the newly generated keystore on your computer. If you want to take advantage of the `credentials.json` file, you'll need to download the keystore with `expo fetch:android:keystore`.

Once you have the keystore file on your computer, you should move it to the appropriate directory. We recommend you keep your keystores in the `android/keystores` directory. **Remember to gitignore all your production keystores!** If you've run the above keytool command and placed the keystore at `android/keystores/release.keystore`, you can ignore that file by adding the following line to `.gitignore`:

```
android/keystores/release.keystore
```

Both keystore generation methods require you to have `keytool` to be installed and in your PATH. If it's not available on your system you'll need to [install JDK](https://jdk.java.net/) (`keytool` is distributed with it).

### Configuring credentials.json

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

## iOS Credentials

### Obtaining the Distribution Certificate and Provisioning Profile

Things become more complicated when it comes to building the iOS app binary. For starters, you need a paid Apple Developer Account. Next, you need to generate the Distribution Certificate and Provisioning Profile for your application. You can do that via the Apple Developer Portal or by choosing Expo to handle this for you.

If you don't know how to do it yourself, just run `expo eas:build --platform ios` and you'll be guided through the entire process. Later, you can download the generated credentials to your computer by running `expo fetch:ios:certs`.

Once you have the Distribution Certificate and Provisioning Profile on your computer, you should move them to the appropriate directory. We recommend you keep them in the `ios/certs` directory. In the rest of this document we assume that they are named `dist.p12` and `profile.mobileprovision` respectively. **Remember to gitignore all files in the directory!** If you've placed the credentials in the suggested directory, you can ignore those files by adding the following line to `.gitignore`:

```
ios/certs/*
```

### Configuring credentials.json

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

## Setting Credentials Source in eas.json

### Auto Mode (Default)

Let's assume we're only building for Android and we're using the following configuration (defined in `eas.json` - [learn more about this file](../eas-json/)):

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

Given this configuration, `expo eas:build` will resolve the credentials using the so-called **auto mode**.

The algorithm of the auto mode works like this:

- If the entry for a given platform in `credentials.json` is defined and the project's credentials exist on the Expo servers:
  - Check if the local credentials match the remote credentials, and if so - use the local credentials.
  - Otherwise, display a prompt to ask which credentials should be used.
- If the entry for a given platform in `credentials.json` is defined but the project's credentials do **not** exist on the Expo servers - use the credentials defined in `credentials.json`.
- If the entry for a given platform in `credentials.json` is **not** defined but the project's credentials exist on the Expo servers - use the credentials from the Expo servers.
- If neither the entry for a given platform in `credentials.json` is defined nor remote credentials exist - display a prompt to ask whether new credentials should be generated and stored on the Expo servers.

### Local Mode

You can configure EAS Build so that `expo eas:build` will be reading the credentials only from `credentials.json`. Just set `"credentialsSource": "local"` in one of your [build profiles](../eas-json/) in `eas.json`.

Example:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic",
        "credentialsSource": "local"
      }
    }
  }
}
```

This can be particularly useful when running the build on CI. If the `credentialsSource` is set to `local` but the `credentials.json` file doesn't exist Expo CLI will throw an error.

### Remote Mode

Alternatively, you can choose to always use the remote credentials, even if the `credentials.json` file exists in the project root. To do so, set `"credentialsSource": "remote"` in the build profile.

Example:

```json
{
  "builds": {
    "android": {
      "release": {
        "workflow": "generic",
        "credentialsSource": "local"
      }
    }
  }
}
```

## Running Builds on CI

The concept of the `credentials.json` file facilitates the process of building your React Native project on CI. The example below shows one of the many ways of automating the release process.

Before you start working on setting up your CI job, make sure you have these two files:

- `credentials.json` with paths and secrets for your credentials, something like this:

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
    }
  }
  ```

- `eas.json` ([learn more](../eas-json/)) with build profiles which enforce using the local `credentials.json` file:

  ```json
  {
    "builds": {
      "android": {
        "release": {
          "workflow": "generic",
          "credentialsSource": "local"
        }
      },
      "ios": {
        "release": {
          "workflow": "generic",
          "credentialsSource": "local"
        }
      }
    }
  }
  ```

Developers tend to provide CI jobs with secrets by using environment variables. One of the challenges with this approach is that the `credentials.json` file contains a JSON object and it might be difficult to escape it properly, so you could assign it to an environment variable. One of the solutions to this problem is to convert the file to a base64-encoded string, set an environment variable to that value, and later decode it and restore the file on the CI.

Consider the following steps:

- Run `base64 credentials.json` in the console.
- On your CI, set the `CREDENTIALS_JSON_BASE64` environment variable with the output of the above command.
- In the CI job, restore the file using a simple shell command:
  ```sh
  echo $CREDENTIALS_JSON_BASE64 | base64 -d > credentials.json
  ```

Similarly, you can encode your keystore, provisioning profile and distribution certificate so you can restore them later on the CI. In order to successfully build your project on the CI, you'll have to make sure all the credentials exist in the CI instance's file system (at the same locations as defined in `credentials.json`).

Once the restoring steps are in place, you can run the build like this:

- `expo eas:build --platform android --non-interactive` to build for Android,
- `expo eas:build --platform ios --non-interactive` to build for iOS,
- or `expo eas:build --platform all --non-interactive` to build for both platforms.

Note that we passed the `--non-interactive` flag to the build command. This prevents Expo CLI from displaying prompts and throws an error when an interactive action is needed.
