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
private const val ERR_SCREEN_ORIENTATION_GET_ORIENTATION = "ERR_SCREEN_ORIENTATION_GET_ORIENTATION"
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
  fun lockAsync(orientationLockStr: String, promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        val orientationLock = OrientationLock.valueOf(orientationLockStr)
        val orientationAttr = orientationLockJSToNative(orientationLock)
        it.requestedOrientation = orientationAttr
        promise.resolve(null)
      } catch (e: IllegalArgumentException) {
        promise.reject(ERR_SCREEN_ORIENTATION_INVALID_ORIENTATION_LOCK, "An invalid OrientationLock was passed in: $orientationLockStr", e)
      } catch (e: InvalidArgumentException) {
        promise.reject(e)
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_UNSUPPORTED_ORIENTATION_LOCK, "Could not apply the ScreenOrientation lock: $orientationLockStr", e)
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
  fun unlockAsync(promise: Promise) {
    lockAsync(OrientationLock.DEFAULT.toString(), promise)
  }

  @ExpoMethod
  fun getOrientationAsync(promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        val orientation = getScreenOrientation(it)
        promise.resolve(orientation.toString()) // may not work
      } catch (e: Exception) {
        promise.reject(ERR_SCREEN_ORIENTATION_GET_ORIENTATION, "Could not get the current screen orientation", e)
      }
    }

    promise.reject(ERR_SCREEN_ORIENTATION_MISSING_ACTIVITY, "Could not find activity.", null)
  }

  @ExpoMethod
  fun getOrientationLockAsync(promise: Promise) {
    mActivityProvider.currentActivity?.let {
      return try {
        val orientationAttr = it.requestedOrientation
        val orientationLock = orientationLockNativeToJS(orientationAttr)
        promise.resolve(orientationLock.toString())
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
  fun supportsOrientationLockAsync(orientationLockStr: String, promise: Promise) {
    try {
      // If we can get the native orientation value from the given string without throwing, we resolve with true
      val lockJS = OrientationLock.valueOf(orientationLockStr)
      orientationLockJSToNative(lockJS)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }

  }

  // https://stackoverflow.com/questions/10380989/how-do-i-get-the-current-orientation-activityinfo-screen-orientation-of-an-a
  // Will not work in all cases as surface rotation is not standardized across android devices, but this is best effort
  private fun getScreenOrientation(activity: Activity): Orientation {
    val windowManager = activity.windowManager
    val rotation = windowManager.defaultDisplay.rotation
    val dm = DisplayMetrics().also(windowManager.defaultDisplay::getMetrics)
    val width = dm.widthPixels
    val height = dm.heightPixels
    val orientation: Orientation

    // if the device's natural orientation is portrait:
    if ((rotation == Surface.ROTATION_0 || rotation == Surface.ROTATION_180)
        && height > width || (rotation == Surface.ROTATION_90 || rotation == Surface.ROTATION_270)
        && width > height) {
      orientation = when (rotation) {
        Surface.ROTATION_0 -> Orientation.PORTRAIT_UP
        Surface.ROTATION_90 -> Orientation.LANDSCAPE_LEFT
        Surface.ROTATION_180 -> Orientation.PORTRAIT_DOWN
        Surface.ROTATION_270 -> Orientation.LANDSCAPE_RIGHT
        else -> Orientation.UNKNOWN
      }
    } else {
      orientation = when (rotation) {
        Surface.ROTATION_0 -> Orientation.LANDSCAPE_LEFT
        Surface.ROTATION_90 -> Orientation.PORTRAIT_DOWN
        Surface.ROTATION_180 -> Orientation.LANDSCAPE_RIGHT
        Surface.ROTATION_270 -> Orientation.PORTRAIT_UP
        else -> Orientation.UNKNOWN
      }
    }

    // if the device's natural orientation is landscape or if the device
    // is square:
    return orientation
  }

  private fun orientationLockNativeToJS(orientationAttr: Int): OrientationLock {
    return when (orientationAttr) {
      ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED -> OrientationLock.DEFAULT
      ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR -> OrientationLock.ALL
      ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT -> OrientationLock.PORTRAIT
      ActivityInfo.SCREEN_ORIENTATION_PORTRAIT -> OrientationLock.PORTRAIT_UP
      ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT -> OrientationLock.PORTRAIT_DOWN
      ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE -> OrientationLock.LANDSCAPE
      ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE -> OrientationLock.LANDSCAPE_LEFT
      ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE -> OrientationLock.LANDSCAPE_RIGHT
      else -> OrientationLock.OTHER
    }
  }

  @Throws(InvalidArgumentException::class)
  private fun orientationLockJSToNative(orientationLock: OrientationLock): Int {
    return when (orientationLock) {
      OrientationLock.DEFAULT -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
      OrientationLock.ALL -> ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR
      OrientationLock.ALL_BUT_UPSIDE_DOWN -> ActivityInfo.SCREEN_ORIENTATION_SENSOR
      OrientationLock.PORTRAIT -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
      OrientationLock.PORTRAIT_UP -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
      OrientationLock.PORTRAIT_DOWN -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT
      OrientationLock.LANDSCAPE -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
      OrientationLock.LANDSCAPE_LEFT -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
      OrientationLock.LANDSCAPE_RIGHT -> ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
      else -> throw InvalidArgumentException("OrientationLock $orientationLock is not mapped to a native Android orientation attr")
    }
  }
}
