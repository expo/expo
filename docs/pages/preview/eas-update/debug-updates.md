---
title: Debugging updates
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight'

It's important to be able to tell the current state of our app at any given time. EAS Update was built with this in mind. Once you know which updates are running on which builds, we can make changes so that our apps are in the state we expect and desire.

## Inspecting the state of deployments

We use the term _deployments_ to refer to the entire system of builds and their updates. The system includes builds, channels, branches, updates, runtime versions, and platforms. Let's inspect these attributes.

### Viewing deployments

The EAS website has a page that shows the current state of our apps. We can view it at [https://expo.dev/accounts/[account]/projects/[project]/deployments](https://expo.dev/accounts/[account]/projects/[project]/deployments).

### Inspecting builds

We can see a list of builds on the EAS website at [https://expo.dev/accounts/[account]/projects/[project]/builds](https://expo.dev/accounts/[account]/projects/[project]/builds). Alternatively, run this EAS CLI command:

```bash
eas build:list

# or

eas build:view [build-id]
```

The output will contain information related to updates like the build's channel and runtime version.

### Inspecting channels

We can see a list of channels with EAS CLI with the following commands:

```bash
eas channel:list

# or

eas channel:view [channel-name]
```

The output will show which branch the channel is currently linked to, and which update that branch is running.

### Inspecting branches

We can see a list of branches with EAS CLI with the following commands:

```bash
eas branch:list

# or

eas branch:view [branch-name]
```

The output will show a branch and its updates.

### Inspecting updates

We can view the details of an update with the following command:

```bash
eas update:view [update-group-id]
```

The output will display the message of the update, when it was created and by whom, and which runtime version and platforms it can run on.

### Inspecting the latest update locally

When we publish an update with EAS Update, it creates a **/dist** folder in the root of your project locally, which includes the assets that were uploaded as a part of the update.

<ImageSpotlight alt="Dist directory" src="/static/images/eas-update/dist.png" />

## Undoing a bad publish

The fastest way to "undo" a bad publish is to re-publish a known good update. Imagine we have a branch with two updates:

```bash
branch: "production"
updates: [
  update 2 (id: xyz2) "fixes typo"     // bad update
  update 1 (id: abc1) "updates color"  // good update
]
```

If "update 2" turned out to be a bad update, we can re-publish "update 1" with a command like this:

```bash
eas branch:publish [branch-name] --republish --group [update-group-id]

# Example
eas branch:publish production --republish --group abc1
```

The example command above would result in a branch that now appears like this:

```bash
branch: "production"
updates: [
  update 3 (id: def3) "updates color"  // re-publish of update 1 (id: abc1)
  update 2 (id: xyz2) "fixes typo"     // bad update
  update 1 (id: abc1) "updates color"  // good update
]
```

Since "update 3" is now the most recent update on the "production" branch, all users who query for an update in the future will receive "update 3" instead of the bad update, "update 2".

While this will prevent all new users from seeing the bad update, users who've already received the bad update will run it until they can download the latest update. Since mobile networks are not always able to download the most recent update, sometimes users may run a bad update for a long time. When viewing error logs for your app, it's normal to see a lingering long tail of errors as your users' apps get the most recent update or build. You'll know you solved the bug when you see the error rate decline dramatically; however, it likely will not disappear completely if you have a diverse user base across many locations and mobile networks.
