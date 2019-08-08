---
title: LinearGradient
---

A React component that renders a gradient view.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-linear-gradient`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-linear-gradient).

## Usage

import SnackEmbed from '~/components/plugins/SnackEmbed';

<SnackEmbed snackId="@charliecruzan/lineargradientexample" />

<br />

<SnackEmbed snackId="@charliecruzan/lineargradienttransparencyexample" />

## API

```js
import { LinearGradient } from 'expo-linear-gradient';
```

### props

`colors`  
An array of colors that represent stops in the gradient. At least two colors are required (otherwise it's not a gradient, it's just a fill!).

`start`  
An array of `[x, y]` where x and y are floats. They represent the position that the gradient starts at, as a fraction of the overall size of the gradient. For example, `[0.1, 0.2]` means that the gradient will start 10% from the left and 20% from the top.

`end`  
Same as start but for the end of the gradient.

`locations`  
An array of the same length as `colors`, where each element is a float with the same meaning as the `start` and `end` values, but instead they indicate where the color at that index should be.
