package expo.modules.screenorientation

import android.app.Activity
import android.content.Context
import android.content.pm.ActivityInfo
import android.util.DisplayMetrics
import android.view.Surface
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.errors.InvalidArgumentException
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.LifecycleEventListener
import org.unimodules.core.interfaces.services.UIManager

private const val ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK = "ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK"
private const val ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY = "ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY"

class ScreenOrientationModule(context: Context) : ExportedModule(context), LifecycleEventListener {
  private lateinit var mActivityProvider: ActivityProvider
  private var mInitialOrientation: Int? = null

  override fun getName() = "ExpoScreenOrientation"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
        ?: throw IllegalStateException("Could not find implementation for ActivityProvider.")

    (moduleRegistry.getModule(UIManager::class.java)
        ?: throw IllegalStateException("Could not find implementation for UIManager."))
        .registerLifecycleEventListener(this)
  }

  override fun onHostResume() {
    mActivityProvider.currentActivity?.let {
      if (mInitialOrientation == null) {
        mInitialOrientation = it.requestedOrientation
      }
    }
  }

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  override fun onDestroy() {
    mActivityProvider.currentActivity?.let { activity ->
      mInitialOrientation?.let {
        activity.requestedOrientation = it
      }
    }
  }

  @ExpoMethod
  fun lockAsync(orientationLock: Int, promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        it.requestedOrientation = importOrientationLock(orientationLock)
        promise.resolve(null)
      } catch (e: InvalidArgumentException) {
        promise.reject(ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK, "An invalid OrientationLock was passed in: $orientationLock", e)
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK, "Could not apply the ScreenOrientation lock: $orientationLock", e)
      }
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun lockPlatformAsync(orientationAttr: Int, promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        it.requestedOrientation = orientationAttr
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK, "Could not apply the ScreenOrientation platform lock: $orientationAttr", e)
      }
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun getOrientationAsync(promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return promise.resolve(getScreenOrientation(it).value)
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun getOrientationLockAsync(promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        promise.resolve(exportOrientationLock(it.requestedOrientation))
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_GET_ORIENTATION_LOCK, "Could not get the current screen orientation lock", e)
      }
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun getPlatformOrientationLockAsync(promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        promise.resolve(it.requestedOrientation)
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_GET_PLATFORM_ORIENTATION_LOCK, "Could not get the current screen orientation platform lock", e)
      }
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun supportsOrientationLockAsync(orientationLock: Int, promise: Promise) {
    try {
      importOrientationLock(orientationLock)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  // https://stackoverflow.com/a/10383164/1123156
  // Will not work in all cases as surface rotation is not standardized across android devices, but this is best effort
  private fun getScreenOrientation(activity: Activity): Orientation {
    val windowManager = activity.windowManager ?: return Orientation.UNKNOWN
    val rotation = windowManager.defaultDisplay.rotation
    val dm = DisplayMetrics().also(windowManager.defaultDisplay::getMetrics)

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
