---
title: EAS Metadata
sidebar_title: Introduction
hideTOC: true
---

import { BoxLink } from '~/ui/components/BoxLink';
import { Callout } from '~/ui/components/Callout';
import { Terminal } from '~/ui/components/Snippet';

<Callout type="warning">  EAS Metadata is in beta and subject to breaking changes.</Callout>
<br />

**EAS Metadata** enables you to automate and maintain your app store presence from the command line.

You need to provide a lot of information to multiple app stores before your users can use your app. This information is often about complex topics that don't apply to your app. You have to start a lengthy review process after providing the information. When the reviewer finds any issues in the information you provided, you need to restart this process.

EAS Metadata uses a [**store.config.json**](./config.md#static-store-config) file to provide information instead of going through multiple forms in the app store dashboards. When it's time to update the app stores, you can push the store config to the app stores.

<Terminal cmd={['$ eas metadata:push']} />

EAS Metadata can also instantly identify known app store restrictions that could trigger a rejection after a lengthy review queue.

Adding the store config file to your repository enables you to collaborate with other team members to prepare the app submission.

> Using VS Code? Install the [VS Code Expo plugin](https://github.com/expo/vscode-expo#readme) for auto-complete, suggestions, and warnings in your **store.config.json** files.

## Get started

<BoxLink
  href="/eas/metadata/getting-started"
  title="Introduction"
  description="Add EAS Metadata to a new project, or generate the store config from an existing app."
/>

<BoxLink
  href="/eas/metadata/config"
  title="Customize the store config"
  description="Customize the store config to adapt EAS Metadata to your preferred workflow."
/>

<BoxLink
  href="/eas/metadata/schema"
  title="Store config schema"
  description="Explore all configurable options EAS Metadata has to offer."
/>
