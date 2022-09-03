---
title: Using automatically managed credentials
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';

For your app to be distributed in an app store, it needs to be digitally signed with credentials such as a keystore or a distribution certificate. This certifies the source of the app and ensures that it can't be tampered with. Other credentials, such as your Apple Push Key and FCM API Key, are needed to send push notifications, but they are not involved in app signing.

Thankfully, that's all that you need to know about any of this to build an app with EAS Build, but if you would like to learn more you can refer to the ["App Signing"](/app-signing/app-credentials.md) guide.

<ConfigClassic>

Learn how to [manage credentials with our classic build service](/app-signing/app-credentials.md).

</ConfigClassic>

Read on to learn how EAS can automatically manage credentials for you and your team.

## Generating app signing credentials

When you run `eas build`, you will be prompted to generate credentials if you have not done so already. Follow the simple instructions to generate your credentials. Where needed, they will be stored on EAS servers. On subsequent builds of your app, these credentials will be re-used unless you specify otherwise.

Generating your iOS credentials (distribution certificate, provisioning profile, and push key) requires you to sign in with an [Apple Developer Program](https://developer.apple.com/programs) membership.

> If you have any security concerns about EAS managing your credentials or about logging in to your Apple Developer account through EAS CLI, please refer to the ["Security"](/app-signing/security) guide. If that does not satisfy your concerns, you can reach out to [secure@expo.dev](mailto:secure@expo.dev) for more information, or use [local credentials](/app-signing/local-credentials.md) instead.

### Push notification credentials

#### iOS

If you haven't set up your Push Notifications key yet, EAS CLI will ask you to set it up during the next `eas build` run.

If you're building an app that was previously built with classic builds (`expo build:ios`), then you already have iOS push notification credentials configured on Expo's servers, so there's nothing you need to do.

You can also set up the Push Notifications key with the `eas credentials` command. Run it, select `iOS`, then `Push Notifications: Manage your Apple Push Notifications Key`, and then choose the appropriate option to set up the key.

#### Android

The Android push notification credentials setup for EAS Build is identical to the setup you might've used for classic builds (`expo build:android`). If you've already configured your app with FCM, there's nothing else you need to do.

If you haven't, please run `eas credentials`, select `Android`, then `Push Notifications: Manage your FCM Api Key`, and then choose the appropriate option to set up the key.

## Sharing credentials with your team

If you collaborate on your project with other developers, it is often useful to give them access to perform builds on their own. [Ensure that your project is configured for collaboration](/accounts/working-together.md) and any teammates that you have added through your [Expo dashboard](https://expo.dev/) will be able to run `eas build` seamlessly, provided that they have sufficient permissions.

After you have generated your iOS credentials, it's no longer necessary to have access to the Apple Developer team in order to start a build. This means that your collaborators can start new iOS builds with only their Expo accounts.

## Inspecting credentials configuration

You can view your currently configured app signing credentials by running `eas credentials`. This command also lets you remove and modify credentials, should you need to make any changes. Typically this is not necessary, but you may want to use it if you want to [sync your credentials to your local machine to run a build locally](syncing-credentials.md) or [migrate existing credentials to be automatically managed](existing-credentials.md).
