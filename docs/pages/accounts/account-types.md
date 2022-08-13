---
title: Account Types
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';

An Expo account is a container that holds Expo projects and allows for different amounts of collaboration. There are three types of Expo accounts; **Personal**, **Organization**, and **Team**. What type of account you choose to put a new project in depends on the nature of the project and, if you plan to collaborate with others, with whom you plan to collaborate.

## Personal Accounts

When you [sign up for an account](https://expo.dev/signup) with Expo, a Personal Account is automatically created for you. This account is a good place to work on your personal projects.

> **Note**: You must not share authentication credentials for your Personal Account with anyone for any reason.

## Organizations

An Organization Account is best used to hold projects that you wish to share with other members of a company or a group of developers. It serves as a shared container where your team can collaborate on one or multiple projects and have access to shared credentials.

You can invite other members to your Organization Account, then give these members different roles that grant a level of access within the organization. For more information, see [role privileges](/accounts/working-together/#managing-access).

It may be useful to create an Organization when:

- You think you may need to transfer control of that Organization's projects in the future.
- Sharing one or multiple projects with a team of collaborators.
- More than one [Owner](/accounts/working-together/#managing-access) needs to be assigned.
- Expenses need to be isolated.
- Granting different levels of access by assigning a role to each member of the organization.
- Structuring projects for different contexts. For example, when working for different clients, a new organization may be created for each client.
- Sharing an [EAS Subscription](https://docs.expo.dev/eas/).

### Creating new Organizations

If you are logged in to your Personal Account, you can create a new Organization from the dashboard:

- Select your account's username from the top menu bar. It will open a dropdown menu.
- Select Create Organization under Organizations in the dropdown menu.

<ImageSpotlight alt="Open the dropdown menu on the dashboard to create a new organization." src="/static/images/accounts/create-an-organization.jpg" style={{maxWidth: 720}} />

- Choose a name for your Organization and select the Create button.

<ImageSpotlight alt="Enter a name of your new organization." src="/static/images/accounts/enter-name-org.jpg" style={{maxWidth: 720}} />

After creating a new Organization, you are redirected to the new dashboard page for the organization. To associate a new project with the Organization, you have to add the [Owner key](/versions/latest/config/app/#owner) under the `"expo"` key to your project's **app.json**.

### Converting Personal Accounts into Organizations

You can convert your Personal Account into an Organization when you want to share access to projects with other members and assign each member a role-based privilege.

From the User Settings of your Personal Account, go to [Convert your account into an organization](https://expo.dev/settings#convert-account) section to start the process.

When you are going through this process, we take a lot of care to make sure that all of the functionality that you and your users rely on will continue to work as expected:

- You can continue to deliver updates and push notifications to your users.
- You will still be able to use any iOS or Android credentials stored on Expo's servers.
- Any integrations using your personal access token or webhooks will continue to operate and are transferred to the new designated owner.
- Your EAS subscription will continue without interruption.
- Your production apps will continue to operate without interruption.

The Organization Account will adopt your old username. Converting a Personal Account into an Organization Account requires that you designate a new user as the owner of the Organization account. You will have the opportunity to designate an existing user or sign up as a new user during the account conversion process.

The example below is Step 3 in the conversion process on a Personal Account with the username "kamalaya8":

<ImageSpotlight alt="Example demonstrating the Step 3 of the conversion process." src="/static/images/accounts/converting-personal-account.jpg" style={{maxWidth: 720}} />

After completing the conversion process, you will no longer be able to log in as the your old user. To continue using Expo services, log into [expo.dev](https://expo.dev/) with the user you selected or created during the conversion process. Then, select the organization from the top left dropdown to access the organization.

### Inviting members

Other Expo users can be invited to join your Organization. To invite a new member:

- From the Organization's dashboard, select Organization settings from the sidebar. This will open all the settings available for the organization.
- In Account settings, select Members from the sidebar.
- Under Members, click the button "Invite Member". This will open a form to invite a member to the organization.
- In the form, enter the email of the user you want to invite and select the role they should have upon joining the organization. For more information, see [role privileges](/accounts/working-together/#managing-access).

<ImageSpotlight alt="Example demonstrating multiple members in an organization." src="/static/images/accounts/members.jpg" style={{maxWidth: 720}} />

When inviting a new member, keep in mind:

- Only members with an Admin or an Owner role can invite others.
- Members with an Owner role can grant members and invitees any role.
- Members with an Admin role can only give members and invitees up to and including Admin role (every role but Owner).

### Renaming an Account

Accounts can be renamed a limited number of times. Only Owners can rename accounts. To rename an account, visit [the account settings](https://expo.dev/accounts/[account]/settings) and follow the steps under [Rename Account](https://expo.dev/accounts/[account]/settings#rename-account).

<ImageSpotlight alt="Rename Account settings panel." src="/static/images/accounts/rename-account.jpg" style={{maxWidth: 720}} />

#### Caveats

After renaming an account, new publishes to projects within the account must be on Expo SDK 43 or above.

### Transferring projects between Accounts

Projects can be transferred a limited number of times. A user must be an Owner or Admin on both source and destination accounts to transfer projects between them. Visit [the project settings page](https://expo.dev/accounts/[account]/projects/[project]/settings) and follow the steps under Transfer project.

<ImageSpotlight alt="Transfer Projects settings panel." src="/static/images/accounts/transfer-project.jpg" style={{maxWidth: 720}} />

#### Caveats

Before transferring a project, make sure that it is on Expo SDK 43 or above. If not, you must upgrade it and rebuild it for OTA updates to continue to work on that project.

> **Note**: If you want to transfer the ownership of a project from your Personal or Organization Account (source) to another person or company (destination), and you cannot be given "Owner or "Admin" permissions on the destination account, you can create an escrow account (a new Organization Account). This solves the problem that a user must be an "Owner" on the source account and either an "Owner" or "Admin" on the destination account to transfer projects between them. Once the escrow account is created, you can grant the ultimate destination account member the Owner role on the escrow account and safely transfer the project to the escrow account. The receiving person or company can then transfer it to their destination account from the escrow account without having had access to the destination account itself.

## Teams

> **Note**: For all new accounts where you want to share access, we recommend you to [create a new Organization](#organizations) Account. It allows more flexibility in role assignments. Creating a Team Account is deprecated.

To create a Team Account, simply [invite Team members](/accounts/working-together/#adding-members) to a Personal Account.
