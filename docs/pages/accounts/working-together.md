---
title: Working Together
---

You can grant other users access to the projects belonging to your Personal Account with Expo Teams. The type of access depends on the granted role. You can sign up for Teams on any of your accounts at [https://expo.io/dashboard/ACCOUNT/settings/services](https://expo.io/dashboard/ACCOUNT/settings/services).

## Adding Members

You can invite new members to your Personal Account, or any account you administrate, from the members page under Settings at [https://expo.io/dashboard/ACCOUNT/settings/members](https://expo.io/dashboard/ACCOUNT/settings/members). You can only add existing Expo users as a member, you can direct them to [https://expo.io/signup](https://expo.io/signup) if they don't have an account yet.

> When adding new developers to your projects, who are publishing updates or create new builds, make sure to add the [`owner`](../../versions/latest/config/app/#owner) property to your project app manifest.

## Managing Access

Access for members is managed through a role-based system. Users can have the _owner_, _admin_, _developer_, or _viewer_ role within Personal Accounts.

| Role          | Description                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**     | Can control most settings on your account, including signing up for paid services, change permissions of other users, and manage programmatic access. |
| **Developer** | Can create new projects, make new builds, release updates, and manage credentials.                                                                    |
| **Viewer**    | Can only view your projects through the Expo Client, but can't modify your projects in any way.                                                       |

## Removing members

To remove members, go to the Expo Dashboard Settings page at [https://expo.io/dashboard/ACCOUNT/settings/members](https://expo.io/dashboard/ACCOUNT/settings/members) and revoke access.
