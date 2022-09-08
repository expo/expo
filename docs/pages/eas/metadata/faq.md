---
title: EAS Metadata - FAQ
sidebar_title: FAQ
---

import { Callout } from '~/ui/components/Callout';

<Callout type="warning">
  EAS Metadata is in beta and subject to breaking changes.
</Callout>

## Pitch

If you are creating or maintaining an app in the stores, keeping the app store information up to date can be a big task.
When making small changes like supporting a new app store region, you have to find and fill in the proper forms in the app store dashboard.
After providing all the required information, that content still needs to be approved, where one word can be the difference between approval and rejection.

EAS Metadata aims to make this stage of app development as easy as possible.
Using a simple configuration file, you can provide all the information to the stores without leaving your project environment.
Combined with built-in validation, you get instant feedback about the content you provide, even before any review.

### Easy to configure, update, or maintain

You can start using EAS Metadata by [creating a new or generating a store config](./getting-started.md#create-the-store-config) from an existing app.
This store config lets you quickly update the app store information without leaving your project environment.
Before pushing the changes to the app stores, EAS Metadata looks for common pitfalls that might result in an app rejection.

### Faster feedback loop with validation

EAS Metadata comes with built-in validation, even before anything is sent to the app stores.
This validation helps you iterate faster over the information without starting a review.
You can start the review process when everything is provided, and no issues are detected.

> Make sure to install the [VS Code Expo plugin](https://github.com/expo/vscode-expo#readme) to get auto-complete, suggestions, and warnings for **store.config.json** files.

### Extensible with dynamic store config

EAS Metadata also supports a more [dynamic store config](./config.md#dynamic-store-config), instead of only using JSON files.
This dynamic store config allows you to gather information from other places like external services.
With asynchronous functions, there are no limits to adapting EAS Metadata to suit your preferred workflow.

## Anti-pitch

Here are some reasons EAS Metadata might **not** be the right fit for a project.

### Need features not yet implemented

We are committed to EAS Metadata and will expand functionality over time.
But that also means that not all functionality is currently implemented in EAS Metadata.
See the [store config schema](./schema.md#config-schema) for all existing functionality.

### Using restricted app store accounts

You'll need to authenticate with the app store before EAS Metadata can access the information.
If you are working with a large corporate account, you might not have permission to use all functionality of EAS Metadata.
While you can use EAS Metadata in these cases, it's often more challenging due to the security restrictions.
