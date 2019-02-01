---
title: ScreenOrientation
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Allows changing supported screen orientations at runtime. This will take priority over the `orientation` key in `app.json`.

## Methods

### `Expo.ScreenOrientation.allow(orientation)`

Deprecated in favour of `Expo.ScreenOrientation.allowAsync`.

### `Expo.ScreenOrientation.allowAsync(orientation)`

Allow a screen orientation. You can call this function multiple times with multiple orientations to allow multiple orientations.


#### Arguments

-   **orientation : `string`** -- The allowed orientation. See the `Orientation` enum for possible values.

#### Returns

Returns a `Promise` with `null` value.

#### Example

```javascript
function changeScreenOrientation() {
  Expo.ScreenOrientation.allowAsync(Expo.ScreenOrientation.Orientation.LANDSCAPE);
}
```

## Orientation types

### `Expo.ScreenOrientation.Orientation`

An object containing the values that can be passed to the allow function.

-   `ALL` -- All 4 possible orientations
-   `ALL_BUT_UPSIDE_DOWN` -- All but reverse portrait, could be all 4 orientations on certain Android devices.
-   `PORTRAIT` -- Portrait orientation, could also be reverse portrait on certain Android devices.
-   `PORTRAIT_UP` -- Upside portrait only.
-   `PORTRAIT_DOWN` -- Upside down portrait only.
-   `LANDSCAPE` -- Any landscape orientation.
-   `LANDSCAPE_LEFT` -- Left landscape only.
-   `LANDSCAPE_RIGHT` -- Right landscape only.

## Detecting when the orientation changes

The best way to do this is to listen for changes to [Dimensions](https://facebook.github.io/react-native/docs/dimensions.html).
