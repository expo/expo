---
title: Working Together
---

You can grant other users access to the projects belonging to your Personal Account with Expo Teams. The type of access depends on the granted role. You can [sign up for Teams](https://expo.io/settings/services) on any of your accounts.

## Adding Members

You can invite new members to your Personal Account, or any account you administrate, from the [Members page](https://expo.io/settings/members) in your dashboard. You can only add users with Expo accounts as members; you can direct them to [https://expo.io/signup](https://expo.io/signup) if they don't have an account yet.

> When adding new developers to your projects, who are publishing updates or create new builds, make sure to add the [`owner`](../versions/latest/config/app.md#owner) property to your project app manifest.

## Managing Access

Access for members is managed through a role-based system. Users can have the _admin_, _developer_, or _viewer_ role within Personal Accounts.

| Role          | Description                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**     | Can control most settings on your account, including signing up for paid services, change permissions of other users, and manage programmatic access. |
| **Developer** | Can create new projects, make new builds, release updates, and manage credentials.                                                                    |
| **Viewer**    | Can only view your projects through the Expo client, but can't modify your projects in any way.                                                       |

## Removing members

To remove members, go to the [Members](https://expo.io/settings/members) page and revoke access.
