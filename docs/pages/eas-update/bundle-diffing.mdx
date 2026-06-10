---
title: Bundle diffing for EAS Update
sidebar_title: Serve bundle diffs
description: Enable your project to accept bundle diffs when available.
---

import { Prerequisites, Requirement } from '~/ui/components/Prerequisites';
import { ContentSpotlight } from '~/ui/components/ContentSpotlight';
import { Terminal } from '~/ui/components/Snippet';

> **important** Bundle diffing is in [**beta**](/more/release-statuses/#beta) and may have limitations. See [Current limitations](#current-limitations) for details.

With bundle diffing, EAS Update delivers a **bundle patch** when possible. When you publish a new update, EAS Update can generate a smaller file containing only the differences between the bundle currently running on the device and the new bundle. This often reduces update download size significantly.

<Prerequisites>
  <Requirement title="Expo SDK 55 or later">Your app must be on Expo SDK 55 or later.</Requirement>
</Prerequisites>

## Enable bundle diffing

Bundle diffing works in two situations. By default, devices already running a published update get a patch when a newer one is available. Opt in (experimental) and devices on a fresh install can also get a patch on their very first update check, instead of downloading the full new bundle.

### Patches between updates

Enabled by default in SDK 56 and later. On SDK 55, set `updates.enableBsdiffPatchSupport` to `true` in your project's [app config](/workflow/configuration/) to opt in.

```json app.json
{
  "expo": {
    "updates": {
      "enableBsdiffPatchSupport": true
    }
  }
}
```

To disable on SDK 56 and later, set `enableBsdiffPatchSupport` to `false`.

### Patches from the embedded bundle

> **info** This mode is experimental and opt-in. The flag and behavior may change.

To enable, set the `EAS_UPDATE_EXPERIMENTAL_UPLOAD_EMBEDDED_BUNDLE` environment variable under `env` in a build profile in **eas.json**:

```json eas.json
{
  "build": {
    "production": {
      "env": {
        "EAS_UPDATE_EXPERIMENTAL_UPLOAD_EMBEDDED_BUNDLE": "1"
      }
    }
  }
}
```

When the build completes, EAS uploads the embedded bundle. Updates published later to the same channel can then be served as patches against it. If you don't use EAS Build, you can upload an embedded bundle yourself. Point `--bundle` at the JavaScript bundle and `--manifest` at the **app.manifest** produced by the native build:

<Terminal
  cmd={[
    '$ eas update:embedded:upload --platform [platform] --bundle [path] --manifest [path] --channel [name]',
  ]}
/>

## Manage uploaded embedded bundles

Find ids with `eas update:embedded:list`, then pass them to view or delete.

List the embedded bundles registered for your project:

<Terminal cmd={['$ eas update:embedded:list']} />

View a single embedded bundle:

<Terminal cmd={['$ eas update:embedded:view [id]']} />

Delete an embedded bundle:

<Terminal cmd={['$ eas update:embedded:delete [id]']} />

The command is safe to retry.

## Verify bundle diffs are being served

### Expo website

You can confirm that bundle diffs are being served from the [Update Details](https://expo.dev/accounts/[account]/projects/[project]/updates) page. Open the Update Group you published, then select the platform you want to inspect.

<ContentSpotlight
  alt="Bundle diffing downloads"
  src="/static/images/eas-update/bundle-diffing.png"
/>

### Updates API

You can confirm that bundle diffs are being served by inspecting update logs with `Updates.readLogEntriesAsync()`. If your app received a patch, you will see an entry indicating it was successfully applied (for example, "patch successfully applied").

## Patch generation and serving

EAS Update uses the [bsdiff algorithm](https://en.wikipedia.org/wiki/Bsdiff) to generate bundle patches.

A patch is served only when:

- **It's meaningfully smaller than the full bundle.** If it isn't, EAS Update serves the full bundle instead.
- **It can be computed efficiently.** If generating the patch is too resource intensive, EAS Update serves the full bundle instead.

## Current limitations

- **Fresh installs receive the full bundle on their first update unless you opt in to [patches from the embedded bundle](#patches-from-the-embedded-bundle).**
- **Patches aren't guaranteed for every possible update pair immediately.** When an update is published, EAS Update precomputes a patch only against the second-newest update on the channel. If a device requests the new update while running a different published update, it will initially receive the full bundle. A patch for that specific base update is then generated on demand and served to future similar requests.
- **Patches are generated shortly after publishing.** It can take a few minutes between publishing an update and the patch being ready. During that window, devices may receive the full bundle.
