---
title: Account Types
---

## Personal Accounts

Every user of Expo has their own Personal Account. With this account, we can safely identify you as the developer or owner of an app. You can use Personal Accounts for all features Expo has to offer. In cases where you take an action that doesn't specify which account it should belong to, it will default to your Personal Account

This account is just for you, **never share access to this account for any reason.**

## Organizations

If you are creating a project that may need to outlive your involvement with it, for instance a professional project for a company you work for, we recommend you create a new Organization for that project.

Common situations where Organizations are useful:

- Transferring control of a project
- Sharing access with others
- Isolating expenses for work projects that you need to submit expenses for
- Structuring projects for different contexts (e.g. work for different clients)

|                                                                     | Personal Accounts | Organization |
| ------------------------------------------------------------------- | ----------------- | ------------ |
| **Create Projects**                                                 | X                 | X            |
| **Build projects to submit to App Store and Play Store**            | X                 | X            |
| **Release bug fixes with updates**                                  | X                 | X            |
| **Transfer control of individual projects to another user**         | Beta              | Beta         |
| **Transfer control of all projects to another user**                |                   | X            |
| **Programmatic access with limited privileges**                     |                   | X            |
| **Designate multiple users who have complete control of a project** |                   | X            |

### Creating New Organizations

To create a new Organization, visit [expo.dev/create-organization](https://expo.dev/create-organization) and sign in to your Personal Account.
You can also create a new Organization by selecting "New Organization" from the account selection dropdown at the top of your dashboard.

You'll need to choose a name for your Organization. Once you have created the organization, you will not be able to rename it.
To associate projects with an Organization, you will need to add the [Owner key](/versions/latest/config/app/#owner) to your project's app.json

### Converting Personal Accounts into Organizations

If you have projects under a Personal Account that you would rather have as an Organization, it is simple and safe to convert to any project created under your Personal Account to an Organization. Simply visit [expo.dev/settings](https://expo.dev/settings) and follow the prompts under **Convert your account into an Organization**.

You will need to assign a Personal Account to manage the Organization as part of this process (You can create a new one if you don't already have another account).

We have taken a lot of care to make sure that all of the functionality that you and your users rely on will continue work as expected, meaning:

- You can continue to deliver updates and push notifications to your users.
- You will still be able to use any iOS or Android credentials stored on Expo's servers.
- Any integrations using your personal access token or webhooks will continue to operate.
- Your subscription to Developer Services will continue without interruption.
- Your production apps will continue to operate without interruption.

### Renaming an Account

> ⚠️ This feature is in private beta and supported only if your projects are on SDK 43 or newer, please email secure@expo.dev with the name of the Personal Account or Organization you would like to rename and confirm your SDK version to join the waitlist.

If you aren't happy with the name you originally chose for your account, you may choose a new name a limited number of times. Simply visit [the account settings page](https://expo.dev/accounts/[account]/settings) and follow the prompts under **Rename Account**.

### Transferring Projects Between Accounts

> ⚠️ This feature is in private beta and supported only for projects on SDK 43 or newer. Please upgrade your SDK if necessary and email secure@expo.dev including the following in your email and you will be added to the waitlist.

Account name (source) \
Account type: Personal/Organization \
Are you an Owner? yes/no

Account name (destination) \
Account type: Personal/Organization \
Are you an Owner? yes/no

(the following for each project)

Project: slug \
Currently uses Push Notifications? yes/no \
Upgraded to SDK 43 or newer? yes/no


> 💡 If it is your case where a project on your Personal or Organization Account (`source`) is sold/given to another company/person (receiving party) and you need to transfer the project to their Account (`destination`) where the receiving party does not want to grant you Owner access to said `destination` Account, you can create a new Organization Account (`escrow`) to complete the transfer from while safely sharing Owner access on the `escrow` Account. 
