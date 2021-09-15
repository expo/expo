---
title: Using automatically managed credentials
---

For your app to be distributed in an app store, it needs to be digitally signed with credentials such as a keystore or a distribution certificate. This certifies the source of the app and ensure that it can't be tampered with. Other credentials, such as your Apple Push Key and FCM API Key, are needed to send push notifications, but they are not involved in app signing.

Thankfully, that's all that you need to know about any of this to build an app with EAS Build, but if you would like to learn more you can refer to the ["App Signing"](/distribution/app-signing.md) guide.

Read on to learn how EAS can automatically manage credentials for you and your team.

## Generating app signing credentials

When you run `eas build`, you will be prompted to generate credentials if you have not done so already. Follow the simple instructions to generate your credentials. Where needed, they will be stored on EAS servers. On subsequent builds of your app, these credentials will be re-used unless you specify otherwise.

Generating your iOS credentials (distribution certificate, provisioning profile, and push key) requires you you to sign in with an [Apple Developer Program](https://developer.apple.com/programs) membership.

> If you have any security concerns about EAS managing your credentials or about logging in to your Apple Developer account through EAS CLI, please refer to the ["Security"](/distribution/security.md) guide. If that does not satisfy your concerns, you can reach out to [preview@expo.dev](mailto:preview@expo.dev) for more information, or use [local credentials](/app-signing/local-credentials.md) instead.

### Push notification credentials

#### iOS

Unlike classic builds, EAS Build **does not** configure your Apple push notification (APN) key by default, because not all apps need to enable push notifications.

If you're building an app that was previously built with classic builds (`expo build:ios`), then you already have iOS push notification credentials configured on Expo's servers, so there's nothing you need to do.

If you are building a brand new project and haven't used classic builds for it before, then you can set up your iOS push notification credentials in 3 steps:

1. Run `expo credentials:manager -p ios` from your project directory.
2. Do you have an existing push notification key you'd like to use? You can only have 2 APN keys total, but a single key can be used with any number of apps. [Learn more about iOS push notification credentials](../distribution/app-signing.md#push-notification-keys).

   - Yes: Select `Use existing Push Notifications Key in current project`
   - No: Select `Add new Push Notifications Key`

3. From there, follow the prompts, and once your key is configured you do _not_ need to rebuild your app.

#### Android

The Android push notification credentials set up for EAS Build is identical to the setup you might've used for classic builds. If you've already configured your app with FCM, there's nothing else you need to do. If you haven't, please follow [this guide](../push-notifications/using-fcm.md).

## Sharing credentials with your team

If you collaborate on your project with other developers, it is often useful to give them access to perform builds on their own. [Ensure that your project is configured for collaboration](/accounts/working-together.md) and any teammates that you have added through your [Expo dashboard](https://expo.dev/) will be able to run `eas build` seamlessly, provided that they have sufficient permissions.

After you have generated your iOS credentials, it's no longer necessary to have access to the Apple Developer team in order to start a build. This means that your collaborators can start new iOS builds with only their Expo accounts. To start a build using existing credentials and without signing in to Apple, run `eas build --skip-credentials-check`. There is no equivalent validation necessary for Android, and so this flag is not needed for Android builds.

## Inspecting credentials configuration

You can view your currently configured app signing credentials by running `eas credentials`. This command also lets you remove and modify credentials, should you need to make any changes. Typically this is not necessary, but you may want to use it if you want to [sync your credentials to your local machine to run a build locally](syncing-credentials.md) or [migrate existing credentials to be automatically managed](existing-credentials.md).
