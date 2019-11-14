---
title: Account Permissions
---

When you're developing your project, multiple people on your team may
need to release new versions or view the work in progress.  These
capabilities can be accessed from https://expo.io/settings/permissions.

## What Do Permissions Mean

### Admin
Users with Admin permission to an account will be able to act as the
owner of that account.  They can add new users to an account, change the
permissions of existing users, sign up for or cancel paid plans, and view
invoices for the account.

The primary account owner will always have Admin access.

### Publish
Users with Publish access to an account will be able to create new
releases with `expo publish` as well as create new platform builds with
`expo build:android` or `expo build:ios`

You will need to add an [`owner` key](../../workflow/configuration/#owner)
to your app.json to take advantage of the Publish permission.

### View
Users with View permission will be able to load projects through the Expo
client as if they were the primary account owner of the account.

