---
title: Configure EAS Submit with eas.json
sidebar_title: Configure with eas.json
description: Learn how to configure your project for EAS Submit with eas.json.
---

import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';

import { BoxLink } from '~/ui/components/BoxLink';

**eas.json** is the configuration file for EAS CLI and services. It is generated when the [`eas build:configure` command](/build/setup/#configure-the-project) runs for the first time in your project and is located next to **package.json** at the root of your project. Even though **eas.json** is not mandatory for using EAS Submit, it makes your life easier if you need to switch between different configurations.

## Production profile

Running `eas submit` without specifying a profile name will use the `production` profile if it is already defined in **eas.json** to configure the submission.

An example **eas.json** with `production` is shown below:

```json eas.json
{
  "cli": {
    "version": ">= 0.34.0"
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "../path/to/api-xxx-yyy-zzz.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "john@turtle.com",
        "ascAppId": "1234567890",
        "appleTeamId": "AB12XYZ34S"
      }
    }
  }
}
```

## Multiple profiles

The JSON object under `submit` can contain multiple submit profiles. Each profile under `submit` can have an arbitrary name as shown in the example below:

{/* prettier-ignore */}
```json eas.json
{
  "cli": {
    "version": /* @info Required EAS CLI version range. */"SEMVER_RANGE"/* @end */,
    "requireCommit": /* @info If true, ensures that all changes are committed before a build. Defaults to false. */boolean/* @end */
  },
  "build": {
    // EAS Build configuration
    /* @hide ... */ /* @end */
  }
  "submit": {
    /* @info any arbitrary name - used as an identifier */"SUBMIT_PROFILE_NAME_1"/* @end */: {
      "android": {
        /* @info Android-specific configuration */...ANDROID_OPTIONS/* @end */
      },
      "ios": {
        /* @info iOS-specific configuration */...IOS_OPTIONS/* @end */
      }
    },
    /* @info any arbitrary name - used as an identifier */"SUBMIT_PROFILE_NAME_2"/* @end */: {
      "extends": "SUBMIT_PROFILE_NAME_1",
      "android": {
        /* @info Android-specific configuration */...ANDROID_OPTIONS/* @end */
      }
    },
    /* @hide ... */ /* @end */
  }
}
```

When you select a build for submission, it chooses the profile that is used for the selected build. If the profile does not exist, it selects the default `production` profile.

You can also use EAS CLI to pick up another `submit` profile by specifying it with a parameter. For example, `eas submit --platform ios --profile submit-profile-name`.

## Share configuration between `submit` profiles

A `submit` profile can extend another profile using the `extends` key. For example, in the `preview` profile you may have `"extends": "production"`. This makes the `preview` profile inherit the configuration of the `production` profile.

## Next step

<BoxLink
  title="EAS Submit schema reference"
  description="Learn about available properties  for EAS Submit to configure and override their default behavior from within your project."
  href="/eas/json/#eas-submit"
  Icon={EasSubmitIcon}
/>
