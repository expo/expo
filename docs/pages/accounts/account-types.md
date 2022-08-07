---
title: Account Types
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';

There are three types of Expo accounts; Personal, Team, and Organization. The type you choose depends on whether you work alone on projects or in a group. However, you must start with at least one Personal Account to use Expo.

When you [sign up for an account](https://expo.dev/signup) with Expo, you are creating a Personal Account. If you want multiple members to have access to project(s), you can create an Organization Account from within your Personal Account and transfer projects individually to the Organization account, if required. Another option is to convert your Personal Account directly to an Organization Account if you want all existing projects transferred automatically.

Before Organization accounts, the only way to work in a group was to add members directly to a Personal Account This is called a Team Account. Only the original member can have an Owner role in a Team Account. An Organization Account can have multiple members with the Owner role. You can choose whichever account type that makes the most sense for your group. Both group account types allow the following:

- Sharing projects
- Assigning member permissions (only one Owner in a Team Account)
- Sharing an [EAS Subscription](https://docs.expo.dev/eas/)

Original or added Owners can invite and assign members of their group a role. This role determines what actions they can or can not perform. Four types of roles are available:

- Owner
- Admin
- Developer
- Viewer

Each role has different privileges. Learn more about [role privileges](/accounts/working-together/#managing-access).

> **Note**: You can switch between accounts or create a new Organization Account from the dropdown in the top left corner. If you want to convert your Personal Account to an Organization Account, select the avatar from the top right corner of the dashboard and then select User Settings.

## Personal Accounts

When you sign up for an account with Expo, you are creating a Personal Account. All Expo users have their own Personal Account(s). Expo uses it to identify you as an individual safely.

A Personal Account is the default account type. For example, your Personal Account username is used when you use the [contact form](https://expo.dev/contact) to reach out for support when you are logged in.

> **Note**: You must not share authentication credentials for your Personal Account with anyone for any reason. Members can log in to their Personal Accounts to access any Team or Organization they are part of. Access to these accounts is available from the dropdown in the top left corner of the dashboard on [expo.dev](https://expo.dev).

## Teams

> **Note**: For all new accounts where you want to share access, we recommend you [create a new Organization](#organizations) Account. It allows more flexibility in role assignments and allows you to keep some projects private to you. However, a Team Account is still a viable way to give other users access to all your projects, just keep in mind that no projects in your account can be private to you if you make a Team Account unless you remove all members.

To create a Team Account, simply [invite Team members](/accounts/working-together/#adding-members) to a Personal Account. An email will be sent that prompts them to create a Personal Expo Account if they do not already have one. In a Team Account, the team's creator has the Owner role only.

For members to access the Team projects, they select the Owner’s account name from the dropdown in the top left under "Teams". The Owner can login to their Personal Account and manage it as usual.

## Organizations

An Organization Account is useful for creating a project that may outlive your involvement. If you are working on a shared project with other members of a company or a group of developers, we recommend you [create an Organization](expo.dev/create-organization) Account.

It is useful to have Organization when:

- Transferring control of a project without losing access to your Personal Account
- Assigning more than one Owner
- Isolating expenses for work-related projects for submitting expenses
- Structuring projects for different contexts. For example, working for different clients

### Creating new Organizations

To create a new Organization, log in to your Personal Account and [open the link](https://expo.dev/create-organization) to create a new organization.

Alternatively, if you are logged in to your Personal Account, you can create a new Organization from the dashboard:

- Select your account's username from the top menu bar. It will open a dropdown menu.
- Select Create Organization under Organizations in the dropdown menu.

<ImageSpotlight alt="Open the dropdown menu on the dashboard to create a new organization." src="/static/images/accounts/create-an-organization.jpg" style={{maxWidth: 720}} />

- Choose a name for your Organization and select the Create button.

<ImageSpotlight alt="Enter a name of your new organization." src="/static/images/accounts/enter-name-org.jpg" style={{maxWidth: 720}} />

After creating a new Organization, you are redirected to the new dashboard page. To associate projects with the Organization, you have to add the [Owner key](/versions/latest/config/app/#owner) under the `"expo"` key to your project's **app.json**.

### Converting Personal Accounts into Organizations

You can convert your Personal Account into an Organization when you want to share access to projects with other members and assign each member a role-based privilege.

From the User Settings of your Personal Account, go to [Convert your account into an organization](https://expo.dev/settings#convert-account) section to start the process.

When you are going through this process, we take a lot of care to make sure that all of the functionality that you and your users rely on will continue to work as expected:

- You can continue to deliver updates and push notifications to your users.
- You will still be able to use any iOS or Android credentials stored on Expo's servers.
- Any integrations using your personal access token or webhooks will continue to operate and are transferred to the new user designated.
- Your EAS subscription will continue without interruption.
- Your production apps will continue to operate without interruption.

The Organization Account will adopt your old username. Converting a Personal Account into an Organization Account requires that you assign a new user as the owner of the Organization account. You will have the opportunity to sign up for a new Personal Account during the account conversion process and assign it or select an existing Personal Account (with a different username) to be the primary Owner of the Organization.

The example below is Step 3 in the conversion process on a Personal Account with the username "kamalaya8":

<ImageSpotlight alt="Example demonstrating the Step 3 of the conversion process." src="/static/images/accounts/converting-personal-account.jpg" style={{maxWidth: 720}} />

After completing the conversion process, you can no longer access the Personal Account you converted. To continue using Expo services, you will log into [expo.dev](https://expo.dev/) with the Personal Account you selected or created to manage the Organization Account. Then, select the organization from the top left dropdown to access the organization.

> **Note**: Before account conversion, make sure that all of your projects are on Expo SDK 43 or above. If not, you must upgrade it and rebuild it for notifications to continue to work on those projects.

### Renaming an Account

Accounts can be renamed a limited number of times. Members in an Organization with Owners or Admin roles can rename the Account. Visit [the account settings](https://expo.dev/accounts/[account]/settings) and follow the steps under [Rename Account](https://expo.dev/settings#rename-account).

<ImageSpotlight alt="Rename Account settings panel." src="/static/images/accounts/rename-account.jpg" style={{maxWidth: 720}} />

#### Caveats

Before renaming an account, make sure that your project is on Expo SDK 43 or above. If not, you must upgrade it and rebuild it for OTA updates to continue to work on that project.

### Transferring projects between Accounts

Projects can be transferred a limited number of times. A user must be an Owner or Admin on both source and destination accounts to transfer projects between them. Visit [the project settings page](https://expo.dev/accounts/[account]/projects/[project]/settings) and follow the steps under Transfer project.

<ImageSpotlight alt="Transfer Projects settings panel." src="/static/images/accounts/transfer-project.jpg" style={{maxWidth: 720}} />

#### Caveats

Before transferring an account, make sure that your project is on Expo SDK 43 or above. If not, you must upgrade it and rebuild it for OTA updates to continue to work on that project.

> **Note**: If you want to transfer the ownership of a project from your Personal or Organization Account (source) to another person or company (destination), and you cannot be given "Owner or "Admin" permissions on the destination account, you can create an escrow account (a new Organization Account). This solves the problem that a user must be an "Owner" or "Admin" on both source and destination accounts to transfer projects between them. Once the escrow account is created, you can grant the ultimate destination account member the Owner role on the escrow account and safely transfer the project to the escrow account. The receiving person or company can then transfer it to their destination account from the escrow account without having had access to the destination account itself.
