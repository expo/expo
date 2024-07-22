---
title: Manage branches and channels with EAS CLI
sidebar_title: Manage branches and channels
description: Learn how to link a branch to a channel and publish updates with EAS CLI.
---

import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { Terminal } from '~/ui/components/Snippet';

EAS Update works by linking _branches_ to _channels_. Channels are specified at build time and exist inside a build's native code. Branches are an ordered list of updates, similar to a Git branch, which is an ordered list of commits. With EAS Update, we can link any channel to any branch, allowing us to make different updates available to different builds.

<ContentSpotlight
  alt='Channel "production" linked to branch "version-1.0"'
  src="/static/images/eas-update/channel-branch-link.png"
/>

The diagram above visualizes this link. Here, we have the builds with the "production" channel linked to the branch named "version-1.0". When we're ready, we can adjust the channel–branch pointer. Imagine we have more fixes tested and ready on a branch named "version-2.0". We could update this link to make the "version-2.0" branch available to all builds with the "production" channel.

<ContentSpotlight
  alt='Channel "production" linked to branch "version-2.0"'
  src="/static/images/eas-update/channel-branch-link-2.png"
/>

## Inspecting the state of your project's updates

### Inspect channels

View all channels:

<Terminal cmd={['$ eas channel:list']} />

View a specific channel:

<Terminal
  cmd={['$ eas channel:view [channel-name]', '', '# Example', '$ eas channel:view production']}
  cmdCopy="eas channel:view [channel-name]"
/>

Create a channel:

<Terminal
  cmd={['$ eas channel:create [channel-name]', '', '# Example', '$ eas channel:create production']}
  cmdCopy="eas channel:create [channel-name]"
/>

### Inspect branches

See all branches:

<Terminal cmd={['$ eas branch:list']} />

See a specific branch and a list of its updates:

<Terminal
  cmd={['$ eas branch:view [branch-name]', '', '', '# Example', '$ eas branch:view version-1.0']}
  cmdCopy="eas branch:view [branch-name]"
/>

### Inspect updates

View a specific update:

<Terminal
  cmd={[
    '$ eas update:view [update-group-id]',
    '',
    '# Example',
    '$ eas update:view dbfd479f-d981-44ce-8774-f2fbcc386aa',
  ]}
  cmdCopy="eas update:view [update-group-id]"
/>

## Changing the state of your project's updates

### Create a new update and publish it

<Terminal
  cmd={[
    '$ eas update --branch [branch-name] --message "..."',
    '',
    '# Example',
    '$ eas update --branch version-1.0 --message "Fixes typo"',
  ]}
  cmdCopy="eas update --branch [branch-name] --message"
/>

If you're using Git, we can use the `--auto` flag to auto-fill the branch name and the message. This flag will use the current Git branch as the branch name and the latest Git commit message as the message.

<Terminal cmd={['$ eas update --auto']} />

### Delete a branch

<Terminal
  cmd={['$ eas branch:delete [branch-name]', '', '# Example', '$ eas branch:delete version-1.0']}
  cmdCopy="eas branch:delete [branch-name]"
/>

### Rename a branch

Renaming branches do not disconnect any channel–branch links. If you had a channel named "production" linked to a branch named "version-1.0", and then you renamed the branch named "version-1.0" to "version-1.0-new", the "production" channel would be linked to the now-renamed branch "version-1.0-new".

<Terminal
  cmd={[
    '$ eas branch:rename --from [branch-name] --to [branch-name]',
    '',
    '# Example',
    '$ eas branch:rename --from version-1.0 --to version-1.0-new',
  ]}
  cmdCopy="eas branch:rename --from [branch-name] --to [branch-name]"
/>

### Republish a previous update within a branch

We can make a previous update immediately available to all users. This command takes the previous update and publishes it again so that it becomes the most current update on the branch. As your users re-open their apps, the apps will see the newly re-published update and will download it.

> Republish is similar to a Git reversion, where the correct commit is placed on top of the Git history.

<Terminal
  cmd={[
    '$ eas update:republish --group [update-group-id]',
    '$ eas update:republish --branch [branch-name]',
    '',
    '# Example',
    '$ eas update:republish --group dbfd479f-d981-44ce-8774-f2fbcc386aa',
    '$ eas update:republish --branch version-1.0',
  ]}
/>

> If you don't know the exact update group ID, you can use the `--branch` flag. This shows a list of the recent updates on the branch and allows you to select the update group to republish.
