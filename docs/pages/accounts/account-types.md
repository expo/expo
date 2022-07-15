---
title: Account Types
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

## Personal Accounts

When you [create a new account](https://expo.dev/signup) with Expo, you are creating a Personal Account. This account is your individual account. Expo uses this account to safely identify you as your application's developer or owner. A Personal Account has access to all features provided by Expo.

Personal Accounts are referred to as the default account type in the scenarios where you take action, but the activity does not specify which account it should belong.

> This account is just for you. Never share access to this account for any reason.

## Organizations

When creating a project that needs to outlive your involvement with it, for instance, a professional project for a company you work for, we recommend you create a new Organization for that project.

Common situations where Organizations are helpful:

- Transferring control of a project
- Sharing access with others
- Isolating expenses for work projects that you need to submit expenses for
- Structuring projects for different contexts, such as working for different clients

|                                                                     | Personal Accounts | Organization |
| ------------------------------------------------------------------- | ----------------- | ------------ |
| **Create Projects**                                                 | ✅                | ✅           |
| **Build projects to submit to App Store and Play Store**            | ✅                | ✅           |
| **Release bug fixes with updates**                                  | ✅                | ✅           |
| **Transfer control of individual projects to another user**         | ✅                | ✅           |
| **Transfer control of all projects to another user**                |                   | ✅           |
| **Programmatic access with limited privileges**                     |                   | ✅           |
| **Designate multiple users who have complete control of a project** |                   | ✅           |

### Creating New Organizations

To create a new Organization, log in to your Personal Account and open the link [expo.dev/create-organization](https://expo.dev/create-organization).

If you are logged in to your Personal Account, you can create a new Organization from the dashboard:

- Select your account's user name from the top menu bar. It will open a dropdown menu.

<ImageSpotlight alt="Open the dropdown menu on the dashboard." src="/static/images/accounts/dropdown-menu.jpg" style={{maxWidth: 720}} />

- Select Create Organization under Organizations in the dropdown.

<ImageSpotlight alt="Select Create Organization in the dropdown to create a new organization." src="/static/images/accounts/create-organization.jpg" style={{maxWidth: 720}} />

- Choose a name for your Organization and select the Create button.

After creating a new Organization, you are redirected to the new dashboard page. To associate projects with an Organization, you have to add the [Owner key](/versions/latest/config/app/#owner) under the `"expo"` key to your project's **app.json**.

### Converting Personal Accounts into Organizations

When you have projects under a Personal Account that you want to be under an Organization, you can convert your Personal Account into an Organization. In the User Settings of your account, go to [Convert your account into an organization](https://expo.dev/settings#convert-account) section and follow the steps the process includes.

<ImageSpotlight alt="Convert your account into an organization setting." src="/static/images/accounts/convert-to-organization.jpg" style={{maxWidth: 720}} />

You will need to assign a Personal Account to manage the Organization as part of this process. You can create a new personal account if you do not have another one.

When you are going through this process, we took a lot of care to make sure that all of the functionality that you and your users rely on will continue to work as expected:

- You can continue to deliver updates and push notifications to your users.
- You will still be able to use any iOS or Android credentials stored on Expo's servers.
- Any integrations using your personal access token or webhooks will continue to operate.
- Your EAS subscription will continue without interruption.
- Your production apps will continue to operate without interruption.

### Renaming an Account

Accounts can be renamed a limited number of times. Visit [the account settings](https://expo.dev/accounts/[account]/settings) and follow the steps under [Rename Account](https://expo.dev/settings#rename-account).

<ImageSpotlight alt="Rename account settings." src="/static/images/accounts/rename-account.jpg" style={{maxWidth: 720}} />

One caveat to remember when renaming accounts is that the new app published for your projects belonging to renamed accounts must be on SDK 43 or higher.

## Transferring Projects Between Accounts

Projects can be transferred a limited number of times. Visit [the project settings page](https://expo.dev/accounts/[account]/projects/[project]/settings) and follow the steps under **Transfer project**.

#### Some caveats

- The person performing the transfer must have the Owner role on both the source and destination accounts.
- New publish for a renamed project must be on SDK 43 or higher.

> In a scenario where a project on your Personal or Organization Account (`source`) is sold/given to another company/person (receiving party), and the receiving party does not want to grant you Owner access to their `destination` account, you can create a new Organization Account (`escrow`), grant the receiving party Owner access, and transfer the project to the `escrow` account. The receiving party then can transfer it to the `destination` account from the `escrow` account.
