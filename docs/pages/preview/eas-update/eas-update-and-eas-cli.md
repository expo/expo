---
title: Using EAS Update with eas-cli
---

EAS Update works by linking _branches_ to _channels_. Channels are specified at build time and exist inside a build's native code. Branches are created when publishing an update. With EAS Update, we can link any channel to any branch, allowing us to make different updates available to different builds.

![Channel branch link initial](/static/images/eas-update/channel-branch-link.png)

The diagram above visualizes this link. Here, we have the builds with channel "production" linked to the branch "version-1.0". When we're ready, we can adjust the channel-branch pointer. Imagine we have more fixes tested and ready on a branch named "version-2.0". We could update this link to make the branch "version-2.0" available to all builds with the channel "production".

![Channel branch link final](/static/images/eas-update/channel-branch-link-2.png)

## Inspecting the state of your project's updates

### Inspect channels

View all channels:

```bash
eas channel:list
```

View a specific channel:

```bash
eas channel:view [channel-name]

# Example
eas channel:view production
```

Create a channel:

```bash
eas channel:create [channel-name]

# Example
eas channel:create production
```

### Inspect branches

See all branches:

```bash
eas branch:list
```

See a specific branch and a list of its updates:

```bash
eas branch:view [branch-name]

# Example
eas branch:view version-1.0
```

### Inspect updates

View a specific update:

```bash
eas update:view [update-group-id]

# Example
eas update:view dbfd479f-d981-44ce-8774-f2fbcc386aa
```

## Changing the state of your project's updates

### Create a new update and publish it

```bash
eas branch:publish [branch-name] --message "..."

# Example
eas branch:publish version-1.0 --message "Fixes typo"
```

If you're using git, we can use the `--auto` flag to auto fill the branch name and the message. This flag will use the current git branch as the branch name and the latest git commit message as the message.

```bash
eas branch:publish --auto
```

### Delete a branch

```bash
eas branch:delete [branch-name]

# Example
eas branch:delete version-1.0
```

### Rename a branch

Renaming branches does not disconnect any channel-branch links. If you had a channel named "production" linked to a branch named "version-1.0", then you renamed the branch named "version-1.0" to "version-1.0-new", the channel production would be linked to the now renamed branch "version-1.0-new".

```bash
eas branch:rename --from [branch-name] --to [branch-name]

# Example
eas branch:rename --from version-1.0 --to version-1.0-new
```

### Republish a previous update within a branch

We can make a previous update immediately available to all users. This command takes the previous update and publishes it again so that it becomes the most current update on the branch. As your users re-open their apps, they will see that the latest update is new, and they'll receive the re-published update.

```bash
eas branch:publish [branch-name] --republish --group [update-group-id]

# Example
eas branch:publish version-1.0 --republish --group dbfd479f-d981-44ce-8774-f2fbcc386aa
```
