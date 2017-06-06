---
title: Branch
---

Expo includes alpha support for [Branch](https://branch.io/) attribution services.

> **Note:** This API only works with standalone builds created with [exp build](../guides/building-standalone-apps.html).

## Importing Branch

The Branch SDK currently lives under Expo's **DangerZone** namespace because it's in a place where it might change significantly. You can import it like this:

```javascript
import { DangerZone } from 'expo';
let { Branch } = DangerZone;
```

## Configuring Branch for your Standalone App

To configure your Branch api keys in your standalone app, specify the key `<platform>.config.branch.apiKey` (once each for `ios` and `android`). See the [exp.json reference](../guides/configuration.html).

If you want to enable [Associated Domains](https://dev.branch.io/getting-started/universal-app-links/guide/) for your iOS build, specify `ios.associatedDomains` in `exp.json` as well.

## Using the Branch API

We use [react-native-branch](https://github.com/BranchMetrics/react-native-branch-deep-linking#usage), so the documentation there is the best resource to follow.
