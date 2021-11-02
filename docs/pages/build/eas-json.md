---
title: Configuring EAS Build with eas.json
sidebar_title: Configuration with eas.json
---

**eas.json** is your go-to place for configuring EAS CLI and services. It is located at the root of your project next to your **package.json**. Configuration for EAS Build all goes under the `"build`" key, and configuration for EAS Submit goes under the `"submit"` key. It looks something like this:

```json
{
  "cli": {
    "version": ">= 0.34.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

## Build profiles

The JSON object under the `build` key can contain multiple build profiles, and you can name these build profiles whatever you like; in the above example, there are three build profiles: `development`, `preview`, and `production`, but these could have been named `foo`, `bar`, and `baz` if that was your preference.

To run a build with a specific profile, execute `eas build --profile <profile-name>`. If you omit the `--profile` flag, EAS CLI will default to using the channel with the name **production**, if it exists.

Inside each build profile you can specify `android` and `ios` fields that contain platform-specific configuration for the build. Fields that are available to both platforms can provided on the platform-specific configuration object or on the root of the profile.

Generally, the schema of **eas.json** looks like this:

<!-- prettier-ignore -->
```json
{
  "cli": {
    "version": /* @info Required EAS CLI version range. */"SEMVER_RANGE"/* @end */,
    "requireCommit": /* @info If true, ensures that all changes are committed before a build. Defults to false. */boolean/* @end */

  },
  "build": {
    /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_1"/* @end */: {
      /* @info options common for both platforms*/...COMMON_OPTIONS/* @end */

      android: {
        /* @info options specific for Android and common for both platforms*/...ANDROID_OPTIONS/* @end */

      }
      ios: {
        /* @info options specific for iOS and common for both platforms*/...IOS_OPTIONS/* @end */

      }
    },
    /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_2"/* @end */: {

    },
    ...
  },
  "submit": {
    // EAS Submit configuration
    ...
  }
}
```

Build profiles can extend another build profile using the `"extends"` key. For example, in the `preview` profile you may have `"extends": "production"`; this would make the `preview` profile inherit the configuration of the `production` profile.

When you want to use EAS Submit, [see how to use **eas.json** to configure your submissions](/submit/eas-json.md). This doc is primarily focused on **eas.json** for EAS Build.

## Common configurations

production, development, internal

simulator