---
title: Troubleshooting EAS Observe
sidebar_title: Troubleshooting
description: Solutions for common EAS Observe issues.
---

import { Collapsible } from '~/ui/components/Collapsible';
import { Terminal } from '~/ui/components/Snippet';
import { Step } from '~/ui/components/Step';
import { Tabs, Tab } from '~/ui/components/Tabs';

## Common issues

### Metrics not appearing in the dashboard

1. Ensure you have created a **new build** after installing `expo-observe`. Metrics are only collected from builds that include the library.
2. Check that you are viewing the correct project in the EAS dashboard.
3. If testing in a debug build, ensure `dispatchInDebug` is set to `true` via `configure()`. See [Enable metrics in development](/eas/observe/configuration/#enable-metrics-in-development).

### Time to first render not showing

Verify that your root layout is wrapped with the root HOC:

<Tabs>

<Tab label="SDK 56 and later">

```jsx
import { ObserveRoot } from 'expo-observe';

function RootLayout() {
  return (/* your layout */);
}

export default ObserveRoot.wrap(RootLayout);
```

</Tab>

<Tab label="SDK 55">

```jsx
import { AppMetricsRoot } from 'expo-observe';

function RootLayout() {
  return (/* your layout */);
}

export default AppMetricsRoot.wrap(RootLayout);
```

</Tab>

</Tabs>

### Time to interactive not showing

This metric requires manual instrumentation. Verify that:

<Tabs>

<Tab label="SDK 56">

1. You are calling `markInteractive()` (from `useObserve()`) after your splash screen is hidden.
2. The call is actually being executed (add a `console.log` to verify).

</Tab>

<Tab label="SDK 55">

1. You are calling `AppMetrics.markInteractive()` after your splash screen is hidden.
2. The call is actually being executed (add a `console.log` to verify).

</Tab>

</Tabs>

<Collapsible summary="Migrating from expo-eas-observe">

If you were part of the private preview and previously used `expo-eas-observe`, follow these steps to migrate to `expo-observe`.

<Step label="1">

**Replace the package**

<Terminal cmd={['$ npx expo install expo-observe', '$ npm uninstall expo-eas-observe']} />

If you previously installed `expo-eas-client` as a separate dependency, you can remove it:

<Terminal cmd={['$ npm uninstall expo-eas-client']} />

</Step>

<Step label="2">

**Update imports**

```diff
- import AppMetrics from 'expo-eas-observe';
+ import { AppMetrics } from 'expo-observe';
```

</Step>

<Step label="3">

**Replace manual `markFirstRender()` with the root HOC**

Instead of calling `markFirstRender()` manually, wrap your root layout with the root HOC for your SDK. This handles the measurement automatically.

Before:

```jsx
import { useEffect } from 'react';
import AppMetrics from 'expo-eas-observe';

export default function RootLayout() {
  useEffect(() => {
    AppMetrics.markFirstRender();
  }, []);

  return (/* your layout */);
}
```

After:

<Tabs>

<Tab label="SDK 56 and later">

```jsx
import { ObserveRoot } from 'expo-observe';

function RootLayout() {
  return (/* your layout */);
}

export default ObserveRoot.wrap(RootLayout);
```

</Tab>

<Tab label="SDK 55">

```jsx
import { AppMetricsRoot } from 'expo-observe';

function RootLayout() {
  return (/* your layout */);
}

export default AppMetricsRoot.wrap(RootLayout);
```

</Tab>

</Tabs>

</Step>

<Step label="4">

**Create a new build**

After completing the migration, create a new build of your app:

<Terminal cmd={['$ eas build']} />

</Step>

</Collapsible>
