---
title: Automate submissions
description: Learn how to enable automatic submissions with EAS Build.
---

import { EasMetadataIcon } from '@expo/styleguide-icons/custom/EasMetadataIcon';

import { BoxLink } from '~/ui/components/BoxLink';

Many mobile deployment processes eventually evolve to the point where the app is automatically submitted to the respective store once an appropriate build is completed. This saves developers from having to wait around for the build to complete, avoids a bit of manual work, and eliminates the need to coordinate providing app store credentials to the team.

EAS Build gives you automatic submissions out of the box with the `--auto-submit` flag. This flag tells EAS Build to pass the build along to EAS Submit with the appropriate submission profile upon completion. Refer to the [EAS Submit documentation](/submit/introduction) for more information on how to set up and configure submissions.

When you run `eas build --auto-submit` you will be provided with a link to a submission details page, where you can track the progress of the submission. You can also find this page at any time on the [submissions dashboard for your project](https://expo.dev/accounts/[account]/projects/[project]/submissions), and it is linked from your build details page.

## Selecting a submission profile

By default, `--auto-submit` will try to use a submission profile with the same name as the selected build profile. If this does not exist, or if you prefer to use a different profile, you can use `--auto-submit-with-profile=<profile-name>` instead.

## Build profile environment variables and submissions

When running `eas build --profile <profile-name> --auto-submit`, the project's **app.config.js** will be evaluated using any environment variables associated with the build profile `<profile-name>`. For example, suppose we ran `eas build -p ios --profile production --auto-submit` with the following configuration:

```json eas.json
{
  "build": {
    "production": {
      "env": {
        "APP_ENV": "production"
      }
    },
    "development": {
      "env": {
        "APP_ENV": "development"
      }
    }
  }
}
```

```js app.config.js
export default () => {
  return {
    name: process.env.APP_ENV === 'production' ? 'My App' : 'My App (DEV)',
    ios: {
      bundleIdentifier: process.env.APP_ENV === 'production' ? 'com.my.app' : 'com.my.app-dev',
    },
    // ... other config here
  };
};
```

The `APP_ENV` variable from the `production` profile will be used when evaluating **app.config.js** for the submission, and therefore the name will be `My App` and the bundle identifier will be `com.my.app`.

## Default submission behavior for app stores

By default, the `--auto-submit` flag will make your build available for internal testing, but will not automatically submit your app to review for public distribution. Sections below describe the default submission behavior for Android and iOS.

### Android submissions

For Android, if sufficient metadata is not provided, the default behavior is to create an internal release for new apps. To control where and how your build is submitted, you can specify the `releaseStatus` and `track` fields in your **eas.json** submission profile:

**Release status options:**

- `draft`: Creates a draft release that requires manual promotion in the Google Play Console
- `completed`: Immediately releases to users on the specified track
- `inProgress`: Staged rollout release (use with `rollout` percentage)
- `halted`: Halted release

When you explicitly set a track to your submission profile in **eas.json**, the `--auto-submit` flag will submit the build to the chosen track. This also requires the `releaseStatus` to be set to `completed`:

**Track options:**

- `internal`: Internal testing track (up to 100 testers) (default)
- `alpha`: Closed testing track
- `beta`: Open testing track
- `production`: Production track (public release)

### iOS submissions

For iOS, the default submission behavior is to submit the build to TestFlight, but not for App Store review. This means:

- The build is submitted to TestFlight and becomes available for internal testing.
- If you have "Enable automatic distribution" turned on in App Store Connect, TestFlight will automatically create a group and invite all your internal TestFlight users to test the build.
- You can also specify additional TestFlight groups using the [`groups`](/eas/json/#groups) field in your **eas.json** submission profile.
- Using TestFlight, you can release a version of your app available for internal and external testing. TestFlight allows sharing with up to 100 testers internally and provides a public link to share with up to 10,000 external testers.
- The release to Apple App Store review is a manual process. Once you have made a submission to TestFlight, you'll have to manually promote the build to the App Store.

This behavior ensures that all iOS releases go through TestFlight when using `--auto-submit`, allowing you to test the release before deciding to make it available to the public.

### Modifying App Store listing (iOS only)

On its own, EAS Submit does not update store metadata (app description, Apple advisory information, languages, and so on). However, once you upload a build to Testflight with EAS Submit with a new version number, you can update this information with EAS Metadata.

<BoxLink
  href="/eas/metadata/getting-started/"
  title="EAS Metadata"
  description="Learn how to update your iOS app's metadata automatically."
  Icon={EasMetadataIcon}
/>
