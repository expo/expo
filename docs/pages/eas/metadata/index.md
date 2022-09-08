---
title: EAS Metadata
sidebar_title: Introduction
hideTOC: true
---

import { BoxLink } from '~/ui/components/BoxLink';
import { Callout } from '~/ui/components/Callout';

<Callout type="warning">
  EAS Metadata is in beta and subject to breaking changes.
</Callout>
<br />

**EAS Metadata** is a service to help you provide all necessary information to the stores and get your app published.

To get your app into the hands of your users, you have to publish the app on multiple app stores. During this process, you'll have to answer questions about complex topics that often don't apply to your app. After submitting the information, you can start the lengthy review process. If the reviewer finds any issues in the information you sent, you'll have to restart the review process.

EAS Metadata makes this easier by allowing users to configure the app store information locally. After this store configuration is ready, you can sync the app stores using `eas metadata:push`. EAS Metadata does not only get the information into the stores; it also tries to find common pitfalls that could cause an app rejection. It does all this before syncing with the app stores, saving you valuable time to spend on your project.

### Get started

<BoxLink title="Getting started" href="/eas/metadata/getting-started" description="Add EAS Metadata to a new project, or generate the store config from an existing app." />

<BoxLink title="Customize the store config" href="/eas/metadata/config" description="Customize the store config to adapt EAS Metadata to your preferred workflow." />

<BoxLink title="Store config schema" href="/eas/metadata/schema" description="Explore all configurable options EAS Metadata has to offer." />
