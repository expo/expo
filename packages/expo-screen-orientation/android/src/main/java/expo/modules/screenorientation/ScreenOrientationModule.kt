package expo.modules.screenorientation

import android.app.Activity
import android.os.Build
import android.util.DisplayMetrics
import android.view.Surface
import android.view.WindowInsets

import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.screenorientation.enums.Orientation
import expo.modules.screenorientation.enums.OrientationAttr
import expo.modules.screenorientation.enums.OrientationLock
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.currentActivity as reactCurrentActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@ExpoModule("ExpoScreenOrientation")
class ScreenOrientationModule : Module() {
  private val weakCurrentActivity get() = reactCurrentActivity
  private val currentActivity
    get() = weakCurrentActivity ?: throw Exceptions.MissingActivity()

  @Volatile
  private var initialOrientation: Int? = null

  // This is unused on Android. It is only here to suppress the native event emitter warning
  @Event(name = "expoDidUpdateDimensions")
  private val onDidUpdateDimensions = event<Map<String, Any?>>()

  override fun onDestroy() {
    initialOrientation?.let {
      weakCurrentActivity?.requestedOrientation = it
    }
  }

  @JS
  suspend fun lockAsync(orientationLock: OrientationLock): Unit = withContext(Dispatchers.IO) {
    try {
      setRequestedOrientation(orientationLock.toPlatformInt())
    } catch (e: InvalidArgumentException) {
      throw InvalidOrientationLockException(orientationLock.value, e)
    }
  }

  @JS
  suspend fun lockPlatformAsync(orientationAttr: OrientationAttr): Unit = withContext(Dispatchers.IO) {
    setRequestedOrientation(orientationAttr.value)
  }

  @JS
  suspend fun getOrientationAsync(): Int = withContext(Dispatchers.IO) {
    getScreenOrientation(currentActivity).value
  }

  @JS
  suspend fun getOrientationLockAsync(): OrientationLock = withContext(Dispatchers.IO) {
    try {
      OrientationLock.fromPlatformInt(currentActivity.requestedOrientation)
    } catch (e: Exception) {
      throw GetOrientationLockException(e)
    }
  }

  @JS
  suspend fun getPlatformOrientationLockAsync(): Int = withContext(Dispatchers.IO) {
    try {
      currentActivity.requestedOrientation
    } catch (e: Exception) {
      throw GetPlatformOrientationLockException(e)
    }
  }

  @JS
  suspend fun supportsOrientationLockAsync(orientationLock: Int): Boolean = withContext(Dispatchers.IO) {
    OrientationLock.supportsOrientationLock(orientationLock)
  }

  // Remembers the orientation from before the first lock, so `onDestroy` can restore it.
  private fun setRequestedOrientation(orientation: Int) {
    val activity = currentActivity
    initialOrientation = initialOrientation ?: activity.requestedOrientation
    activity.requestedOrientation = orientation
  }

  // https://stackoverflow.com/a/10383164/1123156
  // Will not work in all cases as surface rotation is not standardized across android devices, but this is best effort
  private fun getScreenOrientation(activity: Activity): Orientation {
    val windowManager = activity.windowManager ?: return Orientation.UNKNOWN

    val rotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      currentActivity.window.context.display?.rotation ?: return Orientation.UNKNOWN
    } else {
      @Suppress("DEPRECATION")
      windowManager.defaultDisplay.rotation
    }

    val dm = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val windowMetrics = windowManager.currentWindowMetrics
      val insets = windowMetrics.windowInsets
        .getInsetsIgnoringVisibility(WindowInsets.Type.systemBars())
      DisplayMetrics().apply {
        widthPixels = windowMetrics.bounds.width() - insets.left - insets.right
        heightPixels = windowMetrics.bounds.height() - insets.top - insets.bottom
      }
    } else {
      @Suppress("DEPRECATION")
      DisplayMetrics().also(windowManager.defaultDisplay::getMetrics)
    }

    val currentOrientation: Orientation
    if (isPortraitNaturalOrientation(rotation, dm.widthPixels, dm.heightPixels)) {
      currentOrientation = when (rotation) {
        Surface.ROTATION_0 -> Orientation.PORTRAIT_UP
        Surface.ROTATION_90 -> Orientation.LANDSCAPE_RIGHT
        Surface.ROTATION_180 -> Orientation.PORTRAIT_DOWN
        Surface.ROTATION_270 -> Orientation.LANDSCAPE_LEFT
        else -> Orientation.UNKNOWN
      }
    } else {
      // if the device's natural orientation is landscape or if the device
      // is square:
      currentOrientation = when (rotation) {
        Surface.ROTATION_0 -> Orientation.LANDSCAPE_RIGHT
        Surface.ROTATION_90 -> Orientation.PORTRAIT_DOWN
        Surface.ROTATION_180 -> Orientation.LANDSCAPE_LEFT
        Surface.ROTATION_270 -> Orientation.PORTRAIT_UP
        else -> Orientation.UNKNOWN
      }
    }

    return currentOrientation
  }

  /*
   * Check if the device's natural orientation is portrait.
   */
  private fun isPortraitNaturalOrientation(rotation: Int, width: Int, height: Int): Boolean {
    return (rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180) &&
      height > width || (rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270) &&
      width > height
  }
}
