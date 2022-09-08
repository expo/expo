---
title: Getting started with EAS Metadata
sidebar_title: Getting started
---

import { BoxLink } from '~/ui/components/BoxLink';
import { Callout } from '~/ui/components/Callout';
import { Terminal } from '~/ui/components/Snippet';

<Callout type="warning">
  EAS Metadata is in beta and subject to breaking changes.
</Callout>
<br />

EAS Metadata helps you prepare your app for review by uploading most of the required app information using a simple JSON file. It also helps you prevent common pitfalls that may lead to a rejected app submission.

## Prerequisites

EAS Metadata is available starting from EAS CLI >= 0.54.0, and _currently_ only supports the Apple App Store.

If you are using VS Code, make sure to [install the Expo plugin](https://github.com/expo/vscode-expo#readme) for **store.config.json** auto-completion.

## Create the store config

Let's start by creating our **store.config.json** file in the root directory of your project. This file holds all the information you want to upload to the app stores. If you have an existing app in the stores, you can generate the config file by running:

<Terminal cmd={['$ eas metadata:pull']} />

If you don't have an app in the stores, EAS Metadata can't pull that information. You can create a new **store.config.json** file manually instead.

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

> EAS Metadata will use the **store.config.json** file name in your project root by default; you can change the name and location of the file by [configuring the `metadataPath` on the EAS Submit profile](../submit/eas-json.md#metadatapath).

## Update the store config

Now it's time to edit the **store.config.json** file and customize it to your app needs. You can find all available options for the **store.config.json** in the [store config schema](./schema.md).

## Upload a new app version

Before you can upload the **store.config.json**, you must upload a new binary of your app. [Read more about uploading new binaries to stores](../../submit/introduction.md).

After the binary is submitted and processed, we can upload the **store.config.json** to the app stores.

## Upload the store config

When you are happy with the **store.config.json** settings, start syncing that data to the app stores. All you need to do is run the following command:

<Terminal cmd={['$ eas metadata:push']} />

If EAS Metadata runs into any issues with the **store.config.json**, it will warn you when running this command. When the errors are minor, it will still try to upload the rest of the data. After correcting the **store.config.json**, you can rerun the same command to retry uploading the previously failed items.

## Next

<BoxLink title="Customize the store config" href="/eas/metadata/config" description="Customize the store config to adapt EAS Metadata to your preferred workflow." />

<BoxLink title="Store config schema" href="/eas/metadata/schema" description="Explore all configurable options EAS Metadata has to offer." />
