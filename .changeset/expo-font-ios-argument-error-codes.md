---
'expo-font': patch
---

[iOS] Invalid arguments to the native font functions now fail with different errors. A wrong number of arguments fails with `ERR_ARGUMENTS_RANGE_MISMATCH` instead of `ERR_INVALID_ARGS_NUMBER`. A value that can't be converted to a URL or a color, such as the `localUri` of `loadAsync` or the `color` option of `renderToImageAsync`, fails with `ERR_CONVERTING_FAILED` instead of `ERR_ARGUMENT_CAST`. Any other argument of the wrong type fails with a `TypeError` instead of `ERR_ARGUMENT_CAST`. On macOS, `renderToImageAsync` is now defined and rejects with `ERR_RENDER_TO_IMAGE_UNAVAILABLE`.
