---
title: BlurView
---

A React component that renders a native blur view on iOS and falls back to a semi-transparent view on Android. A common usage of this is for navigation bars, tab bars, and modals.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-blur`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-blur).

## Usage

import SnackEmbed from '~/components/plugins/SnackEmbed';

<SnackEmbed snackId="@charliecruzan/blurviewexample" />

<br />

<SnackEmbed snackId="@charliecruzan/blurviewanimatedexample" />

## API

```js
import { BlurView } from 'expo-blur';
```

## props

`tint`
A string: `light`, `default`, or `dark`.

`intensity`
A number from 1 to 100 to control the intensity of the blur effect.

#
