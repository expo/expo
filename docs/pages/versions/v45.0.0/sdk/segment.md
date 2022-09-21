---
title: Segment
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-analytics-segment'
packageName: 'expo-analytics-segment'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

> **Deprecated.** This module will be removed in SDK 46. There will be no replacement that works with the classic build service (`expo build`) because [the classic build service has been superseded by **EAS Build**](https://blog.expo.dev/turtle-goes-out-to-sea-d334db2a6b60). With **EAS Build*** and [Development Builds](/development/introduction.md), you should use official [@segment/analytics-react-native](https://github.com/segmentio/analytics-react-native) instead.

**`expo-analytics-segment`** provides access to `https://segment.com/` mobile analytics. Wraps Segment's [iOS](https://segment.com/docs/sources/mobile/ios/) and [Android](https://segment.com/docs/sources/mobile/android/) sources.

> **Note:** Session tracking may not work correctly when running Experiences in the main Expo app. It will work correctly if you create a standalone app.

<PlatformsSection android emulator ios simulator />

## Installation

<APIInstallSection />

## API

```js
import * as Segment from 'expo-analytics-segment';
```

<APISection packageName="expo-analytics-segment" apiName="Segment" />

## Opting out (enabling/disabling all tracking)

> Depending on the audience for your app (e.g. children) or the countries where you sell your app (e.g. the EU), you may need to offer the ability for users to opt-out of analytics data collection inside your app. You can turn off forwarding to ALL destinations including Segment itself:
> ([Source – Segment docs](https://segment.com/docs/sources/mobile/ios/#opt-out))

```js
import * as Segment from 'expo-analytics-segment';

Segment.setEnabledAsync(false);

// Or if they opt-back-in, you can re-enable data collection:
Segment.setEnabledAsync(true);
```

> **Note:** disabling the Segment SDK ensures that all data collection method invocations (eg. `track`, `identify`, etc) are ignored.

This method is only supported in standalone and detached apps. In Expo Go the promise will reject.

The setting value will be persisted across restarts, so once you call `setEnabledAsync(false)`, Segment won't track the users even when the app restarts. To check whether tracking is enabled, use `Segment.getEnabledAsync()` which returns a promise which should resolve to a boolean.
