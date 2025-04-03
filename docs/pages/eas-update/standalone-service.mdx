---
title: Using EAS Update without other EAS services
sidebar_title: Using without other EAS services
description: Learn how to use EAS Update independently of other EAS services, such as Build.
hideTOC: true
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';

EAS Update works great as a standalone service, so you can use it with or without EAS Build and other EAS services. All of its main features are designed to be agnostic of the build pipeline, and its used in production by large organizations that do not use other EAS services.

<Collapsible summary="What are the downsides of using EAS Update without other EAS services?">

EAS Update and Build work closely together to provide an experience that is greater than the sum of its parts. For example, when you create a build with EAS Build we will help with the bookkeeping for various aspects related to updates, such as the runtime version and channel.

Builds that use the same channel and runtime version are grouped into a **Deployments** section on [expo.dev](https://expo.dev/accounts/[account-name/projects/[project-name]/deployments). These sorts of bookkeeping and insights features that depend on knowledge of builds or other aspects of your app won't be available if you use EAS Update independently of other EAS services.

That said, many organizations are already heavily invested in their CI/CD infrastructure or may have other reasons for wanting to use another build pipeline, and the benefits offered by deeper integration across EAS services may not be worth the switching costs of migrating to a different CI/CD provider.

</Collapsible>

## Using EAS Update without EAS Build

Most of the [installation and configuration steps](/eas-update/getting-started) are identical whether or not you use EAS Build. The primary difference is how the update [channel](/eas-update/eas-cli/) is configured. When using EAS Build, the channel from **eas.json** will automatically be added to your build's **AndroidManifest.xml** and **Expo.plist** at build time. When not using EAS Build, this must be configured manually by [setting the request header in the app config](/eas-update/getting-started/#configure-update-channels-in-appjson), followed by manually creating the channel on the server.

<Terminal
  cmd={[
    '# Create a channel named `production` (for example, which points to the production EAS Update branch by default)',
    '# Your channel names may vary depending on release process',
    '$ eas channel:create production',
  ]}
  cmdCopy="eas channel:create production"
/>
