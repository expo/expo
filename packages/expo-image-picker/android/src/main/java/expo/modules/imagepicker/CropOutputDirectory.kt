package expo.modules.imagepicker

import java.io.File

/**
 * The crop output file is created in the cache directory before [ExpoCropImageActivity] starts.
 * Android can delete the cache directory at any time, for example when storage runs low while
 * the app is in the background. The cropper writes the result through a `FileProvider` URI
 * opened with `MODE_CREATE`, so a missing file is recreated, but a missing parent directory
 * makes the write fail with `ENOENT`. Recreate the directory right before the write starts.
 *
 * The path must be the real output file (an intent extra) because Expo Go's module cache directory
 * is not [android.content.Context.getCacheDir].
 */
internal fun ensureCropOutputDirectoryExists(outputFilePath: String?) {
  if (outputFilePath == null) {
    return
  }
  try {
    File(outputFilePath).parentFile?.mkdirs()
  } catch (_: SecurityException) {
    // Best-effort: a missing directory is still reported as a cropper error.
  }
}
