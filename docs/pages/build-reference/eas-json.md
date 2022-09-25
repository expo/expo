---
title: Build schema for eas.json
sidebar_title: Build schema for eas.json
---

import EasJsonPropertiesTable from '~/components/plugins/EasJsonPropertiesTable';
import { Collapsible } from '~/ui/components/Collapsible';

import commonSchema from '~/scripts/schemas/unversioned/eas-json-build-common-schema.js';
import androidSchema from '~/scripts/schemas/unversioned/eas-json-build-android-schema.js';
import iosSchema from '~/scripts/schemas/unversioned/eas-json-build-ios-schema.js';

**eas.json** is your go-to place for configuring EAS Build (and [EAS Submit](/submit/eas-json.md)). It is located at the root of your project next to your **package.json**.

This document is a reference that outlines the schema for the `"build"` key in **eas.json**. For an explanation of how to use it, please refer to ["Configuring EAS Build eas.json"](/build/eas-json.md).

## Examples

<Collapsible summary="A managed project with several profiles">

```json
{
  "build": {
    "base": {
      "node": "12.13.0",
      "yarn": "1.22.5",
      "env": {
        "EXAMPLE_ENV": "example value"
      },
      "android": {
        "image": "default",
        "env": {
          "PLATFORM": "android"
        }
      },
      "ios": {
        "image": "latest",
        "env": {
          "PLATFORM": "ios"
        }
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "env": {
        "ENVIRONMENT": "development"
      },
      "android": {
        "distribution": "internal",
        "withoutCredentials": true
      },
      "ios": {
        "simulator": true
      }
    },
    "staging": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "staging"
      },
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

</Collapsible>

<Collapsible summary="A bare project with several profiles">

```json
{
  "build": {
    "base": {
      "env": {
        "EXAMPLE_ENV": "example value"
      },
      "android": {
        "image": "ubuntu-18.04-android-30-ndk-r19c",
        "ndk": "21.4.7075529"
      },
      "ios": {
        "image": "latest",
        "node": "12.13.0",
        "yarn": "1.22.5"
      }
    },
    "development": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "staging"
      },
      "android": {
        "distribution": "internal",
        "withoutCredentials": true,
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "simulator": true,
        "buildConfiguration": "Debug"
      }
    },
    "staging": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "staging"
      },
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

</Collapsible>

## Schema

{/* prettier-ignore */}
```json
{
  "cli": {
    "version": /* @info Required EAS CLI version range. */"SEMVER_RANGE"/* @end */,
    "requireCommit": /* @info If true, ensures that all changes are committed before a build. Defaults to false. */boolean/* @end */,
    "appVersionSource": /* @info If set to remote, values stored on EAS servers will take precedense over local values. Defaults to local. */string/* @end */,
    "promptToConfigurePushNotifications": /* @info If set to false, skips Push Notifications credentials setup for EAS Build. Defaults to true. */boolean/* @end */,
  },
  "build": {
    /* @info any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_1"/* @end */: {
      /* @info Options common to both platforms*/...COMMON_OPTIONS/* @end */,

      "android": {
        /* @info Options common to both platforms*/...COMMON_OPTIONS/* @end */,
        /* @info Options specific for Android and common to both platforms*/...ANDROID_OPTIONS/* @end */

      },

      "ios": {
        /* @info Options common to both platforms*/...COMMON_OPTIONS/* @end */,
        /* @info Options specific for iOS and common to both platforms*/...IOS_OPTIONS/* @end */

      }
    },
    /* @info Any arbitrary name - used as an identifier */"BUILD_PROFILE_NAME_2"/* @end */: {},
	...
  }
}
```

> You can specify common options both in the platform-specific configuration object or at the profile's root. The platform-specific options take precedence over globally-defined ones.

> EAS Submit is also configured in **eas.json**. You can find the reference for the `"submit"` fields in ["Configuring EAS Submit with eas.json"](/submit/eas-json.md).

## Options common to both platforms

<EasJsonPropertiesTable schema={commonSchema} />

## Android-specific options

<EasJsonPropertiesTable schema={androidSchema} />

## iOS-specific options

<EasJsonPropertiesTable schema={iosSchema} />
