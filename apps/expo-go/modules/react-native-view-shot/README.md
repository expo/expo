# react-native-view-shot ![](https://img.shields.io/npm/v/react-native-view-shot.svg) ![](https://img.shields.io/badge/react--native-%2040+-05F561.svg)

Capture a React Native view to an image.

<img src="./.readme/recursive.gif" width=300 />

## Install

```bash
yarn add react-native-view-shot

# In Expo

expo install react-native-view-shot
```

Make sure `react-native-view-shot` is correctly linked in Xcode (might require a manual installation, refer to [React Native doc](https://reactnative.dev/docs/linking-libraries-ios.html)).

**Before React Native 0.60.x you would have to:**

```bash
react-native link react-native-view-shot
```

**Since 0.60.x, [autolink](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md) should just work**, on iOS, you'll need to ensure the CocoaPods are installed with:

```bash
npx pod-install
```

## High Level API

```js
import ViewShot from "react-native-view-shot";

function ExampleCaptureOnMountManually {
  const ref = useRef();

  useEffect(() => {
    // on mount
    ref.current.capture().then(uri => {
      console.log("do something with ", uri);
    });
  }, []);

  return (
    <ViewShot ref={ref} options={{ fileName: "Your-File-Name", format: "jpg", quality: 0.9 }}>
      <Text>...Something to rasterize...</Text>
    </ViewShot>
  );
}

// alternative
function ExampleCaptureOnMountSimpler {
  const ref = useRef();

  const onCapture = useCallback(uri => {
    console.log("do something with ", uri);
  }, []);

  return (
    <ViewShot onCapture={onCapture} captureMode="mount">
      <Text>...Something to rasterize...</Text>
    </ViewShot>
  );
}

// waiting an image

function ExampleWaitingCapture {
  const ref = useRef();

  const onImageLoad = useCallback(() => {
    ref.current.capture().then(uri => {
      console.log("do something with ", uri);
    })
  }, []);

  return (
    <ViewShot ref={ref}>
      <Text>...Something to rasterize...</Text>
      <Image ... onLoad={onImageLoad} />
    </ViewShot>
  );
}

// capture ScrollView content
// NB: you may need to go the "imperative way" to use snapshotContentContainer with the scrollview ref instead
function ExampleCaptureOnMountSimpler {
  const ref = useRef();

  const onCapture = useCallback(uri => {
    console.log("do something with ", uri);
  }, []);

  return (
    <ScrollView>
      <ViewShot onCapture={onCapture} captureMode="mount">
        <Text>...The Scroll View Content Goes Here...</Text>
      </ViewShot>
    </ScrollView>
  );
}
```

**Props:**

- **`children`**: the actual content to rasterize.
- **`options`**: the same options as in `captureRef` method.
- **`captureMode`** (string):
  - if not defined (default). the capture is not automatic and you need to use the ref and call `capture()` yourself.
  - `"mount"`. Capture the view once at mount. (It is important to understand image loading won't be waited, in such case you want to use `"none"` with `viewShotRef.capture()` after `Image#onLoad`.)
  - `"continuous"` EXPERIMENTAL, this will capture A LOT of images continuously. For very specific use-cases.
  - `"update"` EXPERIMENTAL, this will capture images each time React redraw (on did update). For very specific use-cases.
- **`onCapture`**: when a `captureMode` is defined, this callback will be called with the capture result.
- **`onCaptureFailure`**: when a `captureMode` is defined, this callback will be called when a capture fails.

## `captureRef(view, options)` lower level imperative API

```js
import { captureRef } from "react-native-view-shot";

captureRef(viewRef, {
  format: "jpg",
  quality: 0.8,
}).then(
  (uri) => console.log("Image saved to", uri),
  (error) => console.error("Oops, snapshot failed", error)
);
```

Returns a Promise of the image URI.

- **`view`** is a reference to a React Native component.
- **`options`** may include:
  - **`fileName`** _(string)_: (Android only) the file name of the file. Must be at least 3 characters long.
  - **`width`** / **`height`** _(number)_: the width and height of the final image (resized from the View bound. don't provide it if you want the original pixel size).
  - **`format`** _(string)_: either `png` or `jpg` or `webm` (Android). Defaults to `png`.
  - **`quality`** _(number)_: the quality. 0.0 - 1.0 (default). (only available on lossy formats like jpg)
  - **`result`** _(string)_, the method you want to use to save the snapshot, one of:
    - `"tmpfile"` (default): save to a temporary file _(that will only exist for as long as the app is running)_.
    - `"base64"`: encode as base64 and returns the raw string. Use only with small images as this may result of lags (the string is sent over the bridge). _N.B. This is not a data uri, use `data-uri` instead_.
    - `"data-uri"`: same as `base64` but also includes the [Data URI scheme](https://en.wikipedia.org/wiki/Data_URI_scheme) header.
  - **`snapshotContentContainer`** _(bool)_: if true and when view is a ScrollView, the "content container" height will be evaluated instead of the container height.
  - [iOS] **`useRenderInContext`** _(bool)_: change the iOS snapshot strategy to use method `renderInContext` instead of `drawViewHierarchyInRect` which may help for some use cases.

## `releaseCapture(uri)`

This method release a previously captured `uri`. For tmpfile it will clean them out, for other result types it just won't do anything.

NB: the tmpfile captures are automatically cleaned out after the app closes, so you might not have to worry about this unless advanced usecases. The `ViewShot` component will use it each time you capture more than once (useful for continuous capture to not leak files).

## `captureScreen()` Android and iOS Only

```js
import { captureScreen } from "react-native-view-shot";

captureScreen({
  format: "jpg",
  quality: 0.8,
}).then(
  (uri) => console.log("Image saved to", uri),
  (error) => console.error("Oops, snapshot failed", error)
);
```

This method will capture the contents of the currently displayed screen as a native hardware screenshot. It does not require a ref input, as it does not work at the view level. This means that ScrollViews will not be captured in their entirety - only the portions currently visible to the user.

Returns a Promise of the image URI.

- **`options`**: the same options as in `captureRef` method.

### Advanced Examples

[Checkout react-native-view-shot-example](example)

## Interoperability Table

> Snapshots are not guaranteed to be pixel perfect. It also depends on the platform. Here is some difference we have noticed and how to workaround.

Model tested: iPhone 6 (iOS), Nexus 5 (Android).

| System                | iOS              | Android           | Windows                |
| --------------------- | ---------------- | ----------------- | ---------------------- |
| View,Text,Image,..    | YES              | YES               | YES                    |
| WebView               | YES              | YES<sup>1</sup>   | YES                    |
| gl-react v2           | YES              | NO<sup>2</sup>    | NO<sup>3</sup>         |
| react-native-video    | NO               | NO                | NO                     |
| react-native-maps     | YES              | NO<sup>4</sup>    | NO<sup>3</sup>         |
| react-native-svg      | YES              | YES               | maybe?                 |
| react-native-camera   | NO               | YES               | NO <sup>3</sup>        |

>

1. Only supported by wrapping a `<View collapsable={false}>` parent and snapshotting it.
2. It returns an empty image (not a failure Promise).
3. Component itself lacks platform support.
4. But you can just use the react-native-maps snapshot function: https://github.com/airbnb/react-native-maps#take-snapshot-of-map

## Performance Optimization

During profiling captured several things that influence on performance:

1. (de-)allocation of memory for bitmap
2. (de-)allocation of memory for Base64 output buffer
3. compression of bitmap to different image formats: PNG, JPG

To solve that in code introduced several new approaches:

- reusable images, that reduce load on GC;
- reusable arrays/buffers that also reduce load on GC;
- RAW image format for avoiding expensive compression;
- ZIP deflate compression for RAW data, that works faster in compare to `Bitmap.compress`

more details and code snippet are below.

### RAW Images

Introduced a new image format RAW. it correspond a ARGB array of pixels.

Advantages:

- no compression, so its supper quick. Screenshot taking is less than 16ms;

RAW format supported for `zip-base64`, `base64` and `tmpfile` result types.

RAW file on disk saved in format: `${width}:${height}|${base64}` string.

### zip-base64

In compare to BASE64 result string this format fast try to apply zip/deflate compression on screenshot results
and only after that convert results to base64 string. In combination zip-base64 + raw we got a super fast
approach for capturing screen views and deliver them to the react side.

### How to work with zip-base64 and RAW format?

```js
const fs = require("fs");
const zlib = require("zlib");
const PNG = require("pngjs").PNG;
const Buffer = require("buffer").Buffer;

const format = Platform.OS === "android" ? "raw" : "png";
const result = Platform.OS === "android" ? "zip-base64" : "base64";

captureRef(this.ref, { result, format }).then((data) => {
  // expected pattern 'width:height|', example: '1080:1731|'
  const resolution = /^(\d+):(\d+)\|/g.exec(data);
  const width = (resolution || ["", 0, 0])[1];
  const height = (resolution || ["", 0, 0])[2];
  const base64 = data.substr((resolution || [""])[0].length || 0);

  // convert from base64 to Buffer
  const buffer = Buffer.from(base64, "base64");
  // un-compress data
  const inflated = zlib.inflateSync(buffer);
  // compose PNG
  const png = new PNG({ width, height });
  png.data = inflated;
  const pngData = PNG.sync.write(png);
  // save composed PNG
  fs.writeFileSync(output, pngData);
});
```

Keep in mind that packaging PNG data is a CPU consuming operation as a `zlib.inflate`.

Hint: use `process.fork()` approach for converting raw data into PNGs.

> Note: code is tested in large commercial project.

> Note #2: Don't forget to add packages into your project:
>
> ```js
> yarn add pngjs
> yarn add zlib
> ```

## Troubleshooting / FAQ

### Saving to a file?

- If you want to save the snapshotted image result to the CameraRoll, just use https://github.com/react-native-cameraroll/react-native-cameraroll
- If you want to save it to an arbitrary file path, use something like https://github.com/itinance/react-native-fs
- For any more advanced needs, you can write your own (or find another) native module that would solve your use-case.

### The snapshot is rejected with an error?

- Support of special components like Video / GL views is not guaranteed to work. In case of failure, the `captureRef` promise gets rejected (the library won't crash).

### get a black or blank result or still have an error with simple views?

Check the **Interoperability Table** above. Some special components are unfortunately not supported. If you have a View that contains one of an unsupported component, the whole snapshot might be compromised as well.

### black background instead of transparency / weird border appear around texts?

- It's preferable to **use a background color on the view you rasterize** to avoid transparent pixels and potential weirdness that some border appear around texts.

### on Android, getting "Trying to resolve view with tag '{tagID}' which doesn't exist"

> you need to make sure `collapsable` is set to `false` if you want to snapshot a **View**. Some content might even need to be wrapped into such `<View collapsable={false}>` to actually make them snapshotable! Otherwise that view won't reflect any UI View. ([found by @gaguirre](https://github.com/gre/react-native-view-shot/issues/7#issuecomment-245302844))

Alternatively, you can use the `ViewShot` component that will have `collapsable={false}` set to solve this problem.

### Getting "The content size must not be zero or negative."

> Make sure you don't snapshot instantly, you need to wait at least there is a first `onLayout` event, or after a timeout, otherwise the View might not be ready yet. (It should also be safe to just wait Image `onLoad` if you have one). If you still have the problem, make sure your view actually have a width and height > 0.

Alternatively, you can use the `ViewShot` component that will wait the first `onLayout`.

### Snapshotted image does not match my width and height but is twice/3-times bigger

This is because the snapshot image result is in real pixel size where the width/height defined in a React Native style are defined in "point" unit. You might want to set width and height option to force a resize. (might affect image quality)

### on Android, capture GL Views

A prop may be necessary to properly capture GL Surface View in the view tree:

```js
/**
  * if true and when view is a SurfaceView or have it in the view tree, view will be captured.
  * False by default, because it can have signoficant performance impact
  */
handleGLSurfaceViewOnAndroid?: boolean;
```

### Trying to share the capture result with `expo-sharing`?

`tmpfile` or the default capture result works best for this. Just be sure to prepend `file://` to result before you call `shareAsync`.

```js
captureRef(viewRef)
  .then((uri) => Sharing.shareAsync(`file://${uri}`, options)
```

---

## Thanks

- To initial iOS work done by @jsierles in https://github.com/jsierles/react-native-view-snapshot
- To React Native implementation of takeSnapshot in iOS by @nicklockwood
- To Windows implementation by @ryanlntn
