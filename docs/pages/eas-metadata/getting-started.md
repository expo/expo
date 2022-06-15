---
title: Getting started with EAS Metadata
sidebar_title: Getting started
---

import { Terminal } from '~/ui/components/Snippet';

> ⚠️ EAS Metadata is in beta and subject to breaking changes.

EAS Metadata helps you prepare your app for review in the app stores and helps you prevent common pitfalls that often could lead to an app rejection.

## Prerequisites

EAS Metadata is available starting from EAS CLI >= 0.54.0, and _only supports the App Store_.

## Create a local store configuration

We first need to create our local **store.config.json** to get started. This file keeps track of all the information for the app stores. If you have an existing app in the stores, you can generate the configuration file by running:

<Terminal cmd={['$ eas metadata:pull']} />

If you don't have an app in the stores, you can create the **store.config.json** manually.

```json
{
  "configVersion": 0,
  "apple": {
    "info": {
      "en-US": {
        "title": "Awesome App",
        "subtitle": "Your self-made awesome app",
        "description": "The most awesome app you've ever seen",
        "keywords": ["awesome", "app"],
        "marketingUrl": "https://example.com/en/promo",
        "supportUrl": "https://example.com/en/support",
        "privacyPolicyUrl": "https://example.com/en/privacy"
      }
    }
  }
}
```

> By default EAS Metadata will use the **store.config.json** file in your project. You can change the name and location of the file by [configuring the `metadataPath` on the EAS Submit](../submit/eas-json.md#metadatapath) profile.

## Update the local store configuration

Now it's time to edit the **store.config.json** file and customize it to your app needs. You can find all available options for the **store.config.json** in the [store configuration reference](./store-json.md).

## Upload a new version of the app

To create a new app version in the stores, you must upload a new binary. We can do this by running:

<Terminal cmd={[
  '# Build and deploy to the stores',
  '$ eas build --auto-submit',
  '# Or deploy a previous build to the stores',
  '$ eas submit',
]} />

After the binary is submitted and processed, we can start syncing the local store configuration.

## Sync the local store configuration

When the **store.config.json** is up to date, we can start syncing the app stores with the local store configuration:

<Terminal cmd={['$ eas metadata:push']} />

## Next

You can explore all available configuration options in the [store configuration reference](./store-json.md).
