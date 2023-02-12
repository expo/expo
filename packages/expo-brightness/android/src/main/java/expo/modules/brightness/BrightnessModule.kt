package expo.modules.brightness

import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.interfaces.permissions.Permissions
import expo.modules.core.interfaces.ExpoMethod

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.view.WindowManager

import java.lang.Exception
import kotlin.math.roundToInt

class BrightnessModule(
  reactContext: Context?,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(reactContext) {

  private val permissionModule: Permissions by moduleRegistry()
  private val activityProvider: ActivityProvider by moduleRegistry()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun getName(): String {
    return "ExpoBrightness"
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise?) {
    Permissions.askForPermissionsWithPermissionsManager(permissionModule, promise, Manifest.permission.WRITE_SETTINGS)
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise?) {
    Permissions.getPermissionsWithPermissionsManager(permissionModule, promise, Manifest.permission.WRITE_SETTINGS)
  }

  @ExpoMethod
  fun setBrightnessAsync(brightnessValue: Float, promise: Promise) {
    val activity = currentActivity
    activity.runOnUiThread {
      try {
        val lp = activity.window.attributes
        lp.screenBrightness = brightnessValue
        activity.window.attributes = lp // must be done on UI thread
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("ERR_BRIGHTNESS", "Failed to set the current screen brightness", e)
      }
    }
  }

  @ExpoMethod
  fun getBrightnessAsync(promise: Promise) {
    val activity = currentActivity
    activity.runOnUiThread {
      val lp = activity.window.attributes
      if (lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) {
        // system brightness is not overridden by the current activity, so just resolve with it
        getSystemBrightnessAsync(promise)
      } else {
        promise.resolve(lp.screenBrightness)
      }
    }
  }

  @ExpoMethod
  fun getSystemBrightnessAsync(promise: Promise) {
    try {
      val brightnessMode = Settings.System.getInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE
      )
      if (brightnessMode == Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC) {
        val brightness = Settings.System.getFloat(
          currentActivity.contentResolver, // https://stackoverflow.com/questions/29349153/change-adaptive-brightness-level-programatically
          // this setting cannot be changed starting in targetSdkVersion 23, but it can still be read
          "screen_auto_brightness_adj"
        )
        promise.resolve((brightness + 1.0f) / 2)
      } else {
        val brightness = Settings.System.getString(
          currentActivity.contentResolver,
          Settings.System.SCREEN_BRIGHTNESS
        )
        promise.resolve(brightness.toInt() / 255f)
      }
    } catch (e: Exception) {
      promise.reject("ERR_BRIGHTNESS_SYSTEM", "Failed to get the system brightness value", e)
    }
  }

  @ExpoMethod
  fun setSystemBrightnessAsync(brightnessValue: Float, promise: Promise) {
    try {
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(currentActivity)) {
        promise.reject("ERR_BRIGHTNESS_PERMISSIONS_DENIED", "WRITE_SETTINGS permission has not been granted")
        return
      }
      // manual mode must be set in order to change system brightness (sets the automatic mode off)
      Settings.System.putInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE,
        Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL
      )
      Settings.System.putInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS,
        (brightnessValue * 255).roundToInt()
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("ERR_BRIGHTNESS_SYSTEM", "Failed to set the system brightness value", e)
    }
  }

  @ExpoMethod
  fun restoreSystemBrightnessAsync(promise: Promise) {
    val activity = currentActivity
    activity.runOnUiThread {
      try {
        val lp = activity.window.attributes
        lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
        activity.window.attributes = lp // must be done on UI thread
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("ERR_BRIGHTNESS", "Failed to set the brightness of the current screen", e)
      }
    }
  }

  @ExpoMethod
  fun isUsingSystemBrightnessAsync(promise: Promise) {
    val activity = currentActivity
    activity.runOnUiThread {
      val lp = activity.window.attributes
      promise.resolve(lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE)
    }
  }

  @ExpoMethod
  fun getSystemBrightnessModeAsync(promise: Promise) {
    try {
      val brightnessMode = Settings.System.getInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE
      )
      promise.resolve(brightnessModeNativeToJS(brightnessMode))
    } catch (e: Exception) {
      promise.reject("ERR_BRIGHTNESS_MODE", "Failed to get the system brightness mode", e)
    }
  }

  @ExpoMethod
  fun setSystemBrightnessModeAsync(brightnessMode: Int, promise: Promise) {
    try {
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(currentActivity)) {
        promise.reject("ERR_BRIGHTNESS_PERMISSIONS_DENIED", "WRITE_SETTINGS permission has not been granted")
        return
      }
      Settings.System.putInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE,
        brightnessModeJSToNative(brightnessMode)
      )
      promise.resolve(null)
    } catch (e: InvalidArgumentException) {
      promise.reject(e)
    } catch (e: Exception) {
      promise.reject("ERR_BRIGHTNESS_MODE", "Failed to set the system brightness mode", e)
    }
  }

  private fun brightnessModeNativeToJS(nativeValue: Int): Int {
    return when (nativeValue) {
      Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC -> 1
      Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL -> 2
      else -> 0
    }
  }

  @Throws(InvalidArgumentException::class)
  private fun brightnessModeJSToNative(jsValue: Int): Int {
    return when (jsValue) {
      1 -> Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC
      2 -> Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL
      else -> throw InvalidArgumentException("Unsupported brightness mode $jsValue")
    }
  }

  private val currentActivity: Activity
    get() = activityProvider.currentActivity
}
