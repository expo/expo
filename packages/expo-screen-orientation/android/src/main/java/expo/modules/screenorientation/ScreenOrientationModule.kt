package expo.modules.screenorientation

import android.app.Activity
import android.content.pm.ActivityInfo
import android.os.Build
import android.util.DisplayMetrics
import android.view.Surface
import android.view.WindowInsets

import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ScreenOrientationModule : Module(), LifecycleEventListener {
  private val currentActivity
    get() = appContext.activityProvider?.currentActivity ?: throw Exceptions.MissingActivity()
  private var initialOrientation: Int? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenOrientation")

    AsyncFunction("lockAsync") Coroutine { orientationLock: Int ->
      try {
        currentActivity.requestedOrientation = importOrientationLock(orientationLock)
        return@Coroutine
      } catch (e: InvalidArgumentException) {
        throw InvalidOrientationLockException(orientationLock, e)
      } catch (e: Exception) {
        throw UnsupportedOrientationLockException(orientationLock, e)
      }
    }

    AsyncFunction("lockPlatformAsync") Coroutine { orientationAttr: Int ->
      try {
        currentActivity.requestedOrientation = orientationAttr
        return@Coroutine
      } catch (e: Exception) {
        throw UnsupportedOrientationPlatformLockException(orientationAttr, e)
      }
    }

    AsyncFunction("getOrientationAsync") Coroutine { ->
      return@Coroutine getScreenOrientation(currentActivity).value
    }

    AsyncFunction("getOrientationLockAsync") Coroutine { ->
      try {
        return@Coroutine exportOrientationLock(currentActivity.requestedOrientation)
      } catch (e: Exception) {
        throw GetOrientationLockException(e)
      }
    }

    AsyncFunction("getPlatformOrientationLockAsync") Coroutine { ->
      try {
        return@Coroutine currentActivity.requestedOrientation
      } catch (e: Exception) {
        throw GetPlatformOrientationLockException(e)
      }
    }

    AsyncFunction("supportsOrientationLockAsync") Coroutine { orientationLock: Int ->
      try {
        importOrientationLock(orientationLock)
        return@Coroutine true
      } catch (e: Exception) {
        return@Coroutine false
      }
    }

    OnCreate {
      appContext.registry
      (
        appContext.legacyModuleRegistry.getModule(UIManager::class.java)
          ?: throw IllegalStateException("Could not find implementation for UIManager.")
        )
        .registerLifecycleEventListener(this@ScreenOrientationModule)
    }

    OnDestroy {
      initialOrientation?.let {
        currentActivity.requestedOrientation = it
      }
    }
  }

  override fun onHostResume() {
    initialOrientation = initialOrientation ?: currentActivity.requestedOrientation
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  // https://stackoverflow.com/a/10383164/1123156
  // Will not work in all cases as surface rotation is not standardized across android devices, but this is best effort
  private fun getScreenOrientation(activity: Activity): Orientation {
    val windowManager = activity.windowManager ?: return Orientation.UNKNOWN

    val rotation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      currentActivity.window.context.display?.rotation ?: return Orientation.UNKNOWN
    } else {
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

  private fun exportOrientationLock(nativeOrientationLock: Int): Int {
    return when (nativeOrientationLock) {
      ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED -> 0
      ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR -> 1
      ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> 2
      ActivityInfo.SCREEN_ORIENTATION_PORTRAIT -> 3
      ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> 4
      ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> 5
      ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> 6
      ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE -> 7
      else -> 8 // other orientation
    }
  }

  @Throws(InvalidArgumentException::class)
  private fun importOrientationLock(orientationLock: Int): Int {
    return when (orientationLock) {
      0 -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      1 -> ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
      2 -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
      3 -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      4 -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
      5 -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
      6 -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
      7 -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      else -> throw InvalidArgumentException("OrientationLock $orientationLock is not mappable to a native Android orientation attr")
    }
  }
}
