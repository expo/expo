---
title: Using automatically managed credentials
---

In order to distribute your app on an app store it needs to be digitally signed with credentials such as a keystore or distribution certificate to certify the source of the app and ensure that its can't be tampered with. Other credentials, such as your Apple Push Key and FCM API Key, are needed to send push notifications, but they are not involved in app signing.

Thankfully, that's all that you need to know about any of this to build an app with EAS Build, but if you would like to learn more you can refer to the ["App Signing"](/distribution/app-signing.md) guide.

Read on to learn how EAS can automatically manage credentials for you and your team.

## Generating app signing credentials

When you run `eas build`, you will be prompted to generate credentials if you have not done so already. Follow the simple instructions to generate your credentials. Where needed, they will be persisted to EAS servers. On subsequent builds of your app, these credentials will be re-used unless you specify otherwise.

Generating your iOS credentials (distribution certificate, provisioning profile, and push key) requires that you to sign in to an Apple account with [Apple Developer Program](https://developer.apple.com/programs) membership.

> If you have any security concerns about EAS managing your credentials or about logging in to your Apple Developer account through EAS CLI, please refer to the ["Security"](/distribution/security.md) guide. If that does not satisfy your concerns, you can reach out to [support@expo.io](mailto:support@expo.io) for more information, or use [local credentials](/app-signing/manual-credentials.md) instead.

## Sharing credentials with your team

If you collaborate on your project with other developers, it is often useful to give them access to perform builds on their own. [Ensure that your project is configured for collaboration](/accounts/working-together.md) and any teammates that you have added through the [Expo dashboard](https://expo.io/) will be able to run `eas build` seamlessly, provided that they have sufficient permissions.

After you have generated your iOS credentials, it's no longer necessary to have access to the Apple Developer team in order to start a build. Collaborators can run `eas build --skip-credentials-check` to skip iOS credentials validation before the build. There is no equivalent validation necessary for Android, and so this flag is not needed for Android builds.

## Inspecting credentials configuration

You can view your currently configured app signing credentials by running `eas credentials`. This command also lets you remove and modify credentials, should you need to make any changes. Typically this is not necessary, but you may want to use it if you want to [sync your credentials to your local machine to run a build locally](syncing-credentials.md) or [migrate existing credentials to be automatically managed](existing-credentials.md).