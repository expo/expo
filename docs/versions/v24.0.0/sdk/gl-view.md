---
title: GLView
---

### `Expo.GLView()`

A `View` that acts as an OpenGL ES render target. On mounting, an OpenGL ES context is created. Its drawing buffer is presented as the contents of the `View` every frame.

Other than the regular `View` props for layout and touch handling, the following props are available:

 `onContextCreate`
A function that will be called when the OpenGL ES context is created. The function is passed a single argument `gl` that has a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) interface.

 `msaaSamples`
`GLView` can enable iOS's built-in [multisampling](https://www.khronos.org/registry/OpenGL/extensions/APPLE/APPLE_framebuffer_multisample.txt). This prop specifies the number of samples to use. By default this is 4. Setting this to 0 turns off multisampling. On Android this is ignored.

## High-level APIs

Since the WebGL API is quite low-level, it can be helpful to use higher-level graphics APIs rendering through a `GLView` underneath. The following libraries integrate popular graphics APIs:

- [expo-three](https://github.com/expo/expo-three) for [three.js](https://threejs.org)
- [expo-processing](https://github.com/expo/expo-processing) for [processing.js](http://processingjs.org)

Any WebGL-supporting library that expects a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) could be used. Some times such libraries assume a web JavaScript context (such as assuming `document`). Usually this is for resource loading or event handling, with the main rendering logic still only using pure WebGL. So these libraries can usually still be used with a couple workarounds. The Expo-specific integrations above include workarounds for some popular libraries.

## WebGL API

Once the component is mounted and the OpenGL ES context has been created, the `gl` object received through the [`onContextCreate`](#expoglviewoncontextcreate "Expo.GLView.onContextCreate") prop becomes the interface to the OpenGL ES context, providing a WebGL API. It resembles a [WebGLRenderingContext](https://www.khronos.org/registry/webgl/specs/latest/1.0/#5.14) in the WebGL 1 spec. An additional method `gl.endFrameEXP()` is present which notifies the context that the current frame is ready to be presented. This is similar to a 'swap buffers' API call in other OpenGL platforms.

The following WebGLRenderContext methods are currently unimplemented:

- `getFramebufferAttachmentParameter()`
- `getRenderbufferParameter()`
- `compressedTexImage2D()`
- `compressedTexSubImage2D()`
- `getTexParameter()`
- `getUniform()`
- `getVertexAttrib()`
- `getVertexAttribOffset()`

The `pixels` argument of [`texImage2D()`](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D) must be `null`, an `ArrayBuffer` with pixel data, or an object of the form `{ localUri }` where `localUri` is the `file://` URI of an image in the device's file system. Thus an `Expo.Asset` object could be used once `.downloadAsync()` has been called on it (and completed) to fetch the resource.

For efficiency reasons the current implementations of the methods don't perform type or bounds checking on their arguments. So, passing invalid arguments could cause a native crash. We plan to update the API to perform argument checking in upcoming SDK versions. Currently the priority for error checking is low since engines generally don't rely on the OpenGL API to perform argument checking and, even otherwise, checks performed by the underlying OpenGL ES implementation are often sufficient.
