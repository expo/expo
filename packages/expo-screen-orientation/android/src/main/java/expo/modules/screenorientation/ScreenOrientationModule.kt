package expo.modules.screenorientation

import android.app.Activity
import android.os.Build
import android.util.DisplayMetrics
import android.view.Surface
import android.view.WindowInsets

import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.screenorientation.enums.Orientation
import expo.modules.screenorientation.enums.OrientationAttr
import expo.modules.screenorientation.enums.OrientationLock

class ScreenOrientationModule : Module(), LifecycleEventListener {
  private val weakCurrentActivity get() = appContext.currentActivity
  private val currentActivity
    get() = weakCurrentActivity ?: throw Exceptions.MissingActivity()

  private val uiManager
    get() = appContext.legacyModuleRegistry.getModule(UIManager::class.java)
      ?: throw IllegalStateException("Could not find implementation for UIManager.")

  private var initialOrientation: Int? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenOrientation")

    // This is unused on Android. It is only here to suppress the native event emitter warning
    Events("expoDidUpdateDimensions")

    AsyncFunction("lockAsync") { orientationLock: OrientationLock ->
      try {
        currentActivity.requestedOrientation = orientationLock.toPlatformInt()
      } catch (e: InvalidArgumentException) {
        throw InvalidOrientationLockException(orientationLock.value, e)
      }
    }

    AsyncFunction("lockPlatformAsync") { orientationAttr: OrientationAttr ->
      currentActivity.requestedOrientation = orientationAttr.value
    }

    AsyncFunction<Int>("getOrientationAsync") {
      return@AsyncFunction getScreenOrientation(currentActivity).value
    }

    AsyncFunction<OrientationLock>("getOrientationLockAsync") {
      try {
        return@AsyncFunction OrientationLock.fromPlatformInt(currentActivity.requestedOrientation)
      } catch (e: Exception) {
        throw GetOrientationLockException(e)
      }
    }

    AsyncFunction<Int>("getPlatformOrientationLockAsync") {
      try {
        return@AsyncFunction currentActivity.requestedOrientation
      } catch (e: Exception) {
        throw GetPlatformOrientationLockException(e)
      }
    }

    AsyncFunction("supportsOrientationLockAsync") { orientationLock: Int ->
      return@AsyncFunction OrientationLock.supportsOrientationLock(orientationLock)
    }

    OnCreate {
      uiManager.registerLifecycleEventListener(this@ScreenOrientationModule)
    }

    OnDestroy {
      uiManager.unregisterLifecycleEventListener(this@ScreenOrientationModule)
      initialOrientation?.let {
        weakCurrentActivity?.requestedOrientation = it
      }
    }
  }

  override fun onHostResume() {
    initialOrientation = initialOrientation ?: weakCurrentActivity?.requestedOrientation
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
