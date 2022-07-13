---
title: GLView
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-gl'
packageName: 'expo-gl'
---

import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-gl`** provides a `View` that acts as an OpenGL ES render target, useful for rendering 2D and 3D graphics. On mounting, an OpenGL ES context is created. Its drawing buffer is presented as the contents of the `View` every frame.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

<SnackInline label='Basic GL usage' dependencies={['expo-gl']}>

```js
import React from 'react';
import { View } from 'react-native';
import { GLView } from 'expo-gl';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GLView style={{ width: 300, height: 300 }} onContextCreate={onContextCreate} />
    </View>
  );
}

function onContextCreate(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0, 1, 1, 1);

  // Create vertex shader (shape & position)
  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(
    vert,
    `
    void main(void) {
      gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
      gl_PointSize = 150.0;
    }
  `
  );
  gl.compileShader(vert);

  // Create fragment shader (color)
  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    frag,
    `
    void main(void) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  `
  );
  gl.compileShader(frag);

  // Link together into a program
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.POINTS, 0, 1);

  gl.flush();
  gl.endFrameEXP();
}
```

</SnackInline>

## API

```js
import { GLView } from 'expo-gl';
```

## Props

Other than the regular `View` props for layout and touch handling, the following props are available:

### `onContextCreate`

A function that will be called when the OpenGL ES context is created. The function is passed a single argument `gl` that has a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) interface.

### `msaaSamples`

`GLView` can enable iOS's built-in [multisampling](https://www.khronos.org/registry/OpenGL/extensions/APPLE/APPLE_framebuffer_multisample.txt). This prop specifies the number of samples to use. By default this is 4. Setting this to 0 turns off multisampling. On Android this is ignored.

## Methods

### `takeSnapshotAsync(options)`

Same as [GLView.takeSnapshotAsync](#glviewtakesnapshotasyncgl-options) but uses WebGL context that is associated with the view on which the method is called.

## Static methods

### `GLView.createContextAsync()`

Imperative API that creates headless context which is devoid of underlying view. It's useful for headless rendering or in case you want to keep just one context per application and share it between multiple components.
It is slightly faster than usual context as it doesn't swap framebuffers and doesn't present them on the canvas, however it may require you to take a snapshot in order to present its results.
Also, keep in mind that you need to set up a viewport and create your own framebuffer and texture that you will be drawing to, before you take a snapshot.

#### Returns

A promise that resolves to WebGL context object. See [WebGL API](#webgl-api) for more details.

### `GLView.destroyContextAsync(gl)`

Destroys given context.

#### Arguments

- **gl (_object_)** -- WebGL context to destroy.

#### Returns

A promise that resolves to boolean value that is `true` if given context existed and has been destroyed successfully.

### `GLView.takeSnapshotAsync(gl, options)`

Takes a snapshot of the framebuffer and saves it as a file to app's cache directory.

#### Arguments

- **gl (_object_)** -- WebGL context to take a snapshot from.
- **options (_object_)** -- A map of options:
  - **framebuffer (_WebGLFramebuffer_)** -- Specify the framebuffer that we will be reading from. Defaults to underlying framebuffer that is presented in the view or the current framebuffer if context is headless.
  - **rect (`{ x: number, y: number, width: number, height: number }`)** -- Rect to crop the snapshot. It's passed directly to `glReadPixels`.
  - **flip (_boolean_)** -- Whether to flip the snapshot vertically. Defaults to `false`.
  - **format (_string_)** -- Either `'jpeg'`, `'png'` or `'webp'` (_Android only_ for the latter). Specifies what type of compression should be used and what is the result file extension. PNG compression is lossless but slower, JPEG is faster but the image has visible artifacts. Defaults to `'jpeg'`.
  - **compress (_number_)** -- A value in range 0 - 1 specifying compression level of the result image. 1 means no compression and 0 the highest compression. Defaults to `1.0`.

> **Note:** When using WebP format, the iOS version will print a warning, and generate a `'png'` file instead. It is recommendable to use platform dependant code in this case. You can refer to the [documentation on platform specific code](/versions/latest/react-native/platform-specific-code).

#### Returns

Returns `{ uri, localUri, width, height }` where `uri` is a URI to the snapshot. `localUri` is a synonym for `uri` that makes this object compatible with `texImage2D`. `width, height` specify the dimensions of the snapshot.

## High-level APIs

Since the WebGL API is quite low-level, it can be helpful to use higher-level graphics APIs rendering through a `GLView` underneath. The following libraries integrate popular graphics APIs:

- [expo-three](https://github.com/expo/expo-three) for [three.js](https://threejs.org)
- [expo-processing](https://github.com/expo/expo-processing) for [processing.js](http://processingjs.org)

Any WebGL-supporting library that expects a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) could be used. Some times such libraries assume a web JavaScript context (such as assuming `document`). Usually this is for resource loading or event handling, with the main rendering logic still only using pure WebGL. So these libraries can usually still be used with a couple workarounds. The Expo-specific integrations above include workarounds for some popular libraries.

## WebGL API

Once the component is mounted and the OpenGL ES context has been created, the `gl` object received through the `onContextCreate` prop becomes the interface to the OpenGL ES context, providing a WebGL API. It resembles a [WebGL2RenderingContext](https://www.khronos.org/registry/webgl/specs/latest/2.0/#3.7) in the WebGL 2 spec. However, some older Android devices may not support WebGL2 features. To check whether the device supports WebGL2 it's recommended to use `gl instanceof WebGL2RenderingContext`.
An additional method `gl.endFrameEXP()` is present which notifies the context that the current frame is ready to be presented. This is similar to a 'swap buffers' API call in other OpenGL platforms.

The following WebGL2RenderingContext methods are currently unimplemented:

- `getFramebufferAttachmentParameter()`
- `getRenderbufferParameter()`
- `compressedTexImage2D()`
- `compressedTexSubImage2D()`
- `getTexParameter()`
- `getUniform()`
- `getVertexAttrib()`
- `getVertexAttribOffset()`
- `getBufferSubData()`
- `getInternalformatParameter()`
- `renderbufferStorageMultisample()`
- `compressedTexImage3D()`
- `compressedTexSubImage3D()`
- `fenceSync()`
- `isSync()`
- `deleteSync()`
- `clientWaitSync()`
- `waitSync()`
- `getSyncParameter()`
- `getActiveUniformBlockParameter()`

The `pixels` argument of [`texImage2D()`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D) must be `null`, an `ArrayBuffer` with pixel data, or an object of the form `{ localUri }` where `localUri` is the `file://` URI of an image in the device's file system. Thus an `Asset` object could be used once `.downloadAsync()` has been called on it (and completed) to fetch the resource.

For efficiency reasons the current implementations of the methods don't perform type or bounds checking on their arguments. So, passing invalid arguments could cause a native crash. We plan to update the API to perform argument checking in upcoming SDK versions. Currently the priority for error checking is low since engines generally don't rely on the OpenGL API to perform argument checking and, even otherwise, checks performed by the underlying OpenGL ES implementation are often sufficient.

## Integration with Reanimated worklets

To use this API inside Reanimated worklet you need to pass the GL context ID to the worklet and recreate the GL object like in the example bellow.

<SnackInline label='GL usage in reanimated worklet' dependencies={['expo-gl', 'react-native-reanimated']}>

```js
import React from 'react';
import { View } from 'react-native';
import { runOnUI } from 'react-native-reanimated';
import { GLView } from 'expo-gl';

function render(gl) {
  'worklet';
  // add your WebGL code here
}

function onContextCreate(gl) {
  runOnUI((contextId: number) => {
    'worklet';
    const gl = GLView.getWorkletContext(contextId)
    render(gl);
  })(gl.contextId);
}

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GLView style={{ width: 300, height: 300 }} onContextCreate={onContextCreate} />
    </View>
  );
}
```

</SnackInline>

For more in-depth example on how to use `expo-gl` with Reanimated and Gesture Handler you can check [this example](https://github.com/expo/expo/tree/main/apps/native-component-list/src/screens/GL/GLReanimatedExample.tsx).

### Limitations

Worklet runtime is imposing some limitations on the code that runs inside it, so if you have existing WebGL code, it'll likely require some modifications to run inside a worklet thread.
- Third-party libraries like Pixi.js or Three.js won't work inside the worklet, you can only use functions that have `'worklet'` added at the start.
- If you need to load some assets to pass to the WebGL code, it needs to be done on the main thread and passed via some reference to the worklet. If you are using `expo-assets` you can just pass asset object returned by `Asset.fromModule` or from hook `useAssets` to the `runOnUI` function.
- To implement a rendering loop you need to use `requestAnimationFrame`, APIs like `setTimeout` are not supported.
- It's supported only on Android and iOS, it doesn't work on Web.
 
Check [Reanimated documentation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/worklets) to learn more.

## Remote Debugging & GLView

This API does not function as intended with remote debugging enabled. The React Native debugger runs JavaScript on your computer (not the mobile device itself), and GLView requires synchronous native calls (which are not supported in Chrome).
