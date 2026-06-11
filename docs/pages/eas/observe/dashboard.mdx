---
title: EAS Observe dashboard
sidebar_title: Dashboard
description: View performance metrics, filter by platform, environment, and release, and investigate individual sessions in the EAS Observe dashboard.
---

import { ContentSpotlight } from '~/ui/components/ContentSpotlight';

The EAS Observe dashboard provides a visual overview of your app's performance metrics. Open your project in the EAS dashboard and select [**Observe**](https://expo.dev/accounts/[account]/projects/[project]/observe) from the navigation menu.

<ContentSpotlight
  alt="The EAS Observe dashboard showing startup metrics, release markers, and statistical breakdowns for an app."
  src="/static/images/expo-observe/observe-dashboard-light.webp"
  darkSrc="/static/images/expo-observe/observe-dashboard-dark.webp"
/>

## Summary

At the top of the page, the dashboard shows a summary of the data in view: active users, releases, builds, and updates. The counts update as you change filters. Click **Show all** to clear release filtering and see aggregate counts across every release.

## Filters

Filters control which events are included in the metrics below.

- **Platform**: Android or iOS.
- **Environment**: filter to a specific [environment](/eas/observe/configuration/#environments), such as `production` or `preview`. Defaults to **All environments**.
- **Time range**: 1 hour, 12 hours, 1 day, 3 days, 7 days, 14 days, 21 days, 30 days, or 60 days. Defaults to **Last 14 Days**.
- **Release**: filter to a specific app version, a specific native build, or a specific OTA update.

## Tabs

The dashboard groups data into four tabs:

- **App startup**: startup performance metrics (cold launch, warm launch, bundle load time, time to first render, time to interactive). See the [Metrics reference](/eas/observe/reference/metrics/) for full descriptions.
- **EAS Update**: download time for OTA updates and a per-update table. See [EAS Update download performance](/eas/observe/eas-update/) for details.
- **Events** (requires SDK 56 and later): user-defined events logged with [`Observe.logEvent`](/eas/observe/events/), with counts and links to drill into each event.
- **Navigation** (requires SDK 56 and later): per-route navigation timings with cold vs warm time to first render and time to interactive. Requires [Expo Router](/eas/observe/integrations/expo-router/) or [React Navigation](/eas/observe/integrations/react-navigation/).

## Metric cards

Each metric appears as a card with a chart and statistical breakdowns. For every metric, the dashboard displays:

- **Median**: the middle value, representing typical user experience.
- **Avg**: the arithmetic mean across all events.
- **Min** and **Max**: the fastest and slowest recorded values.
- **P90** and **P99**: values below which 90% or 99% of events fall, useful for identifying tail latency.

On the App startup tab, switch between a list layout (one chart per row) and a grid layout. Use the **Show builds** and **Show updates** toggles to control whether release markers appear on charts.

## Release markers and comparison

When you publish a new native build or OTA update, each chart shows a release marker at the deployment time. Markers that fall close together on the time axis group into a single indicator to keep charts readable.

Click a marker to open a popover with details for that release, including the version, build number or update ID, user and event counts, and the metric value at that point. From the popover, drill into the events for that release.

Without a release filter, App startup cards also show the metric for the **latest** and **previous** releases at the top of the card. This makes regressions easier to spot at a glance.

## Investigating sessions

When something looks off, drill into individual sessions from the **Events** tab or from a release marker popover. A session timeline shows:

- All events recorded during that session (startup, user-defined, and update download events).
- Device metadata: platform, app version, build number, OS, and timestamps.
- Counts of events by type.

This helps you understand why specific users or devices experience slower performance, whether it's a particular OS version, network condition, or release.

## Handoff to AI

Use the **Handoff to AI** button in the page header to copy the current dashboard state as a structured prompt. Paste it into Claude or another AI assistant to ask questions about the metrics you're seeing, such as why a particular release regressed or which routes are slowest.
