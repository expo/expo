package expo.modules.brightness

import android.Manifest
import android.provider.Settings
import android.view.WindowManager
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.roundToInt

const val brightnessChangeEvent = "Expo.brightnessDidChange"

class BrightnessModule : Module() {
  private val currentActivity
    get() = appContext.throwingActivity

  override fun definition() = ModuleDefinition {
    Name("ExpoBrightness")

    // This is unused on Android. It is only here to suppress the native event emitter warning
    Events(brightnessChangeEvent)

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.WRITE_SETTINGS)
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.WRITE_SETTINGS)
    }

    AsyncFunction("setBrightnessAsync") { brightnessValue: Float ->
      val lp = currentActivity.window.attributes
      lp.screenBrightness = brightnessValue
      currentActivity.window.attributes = lp // must be done on UI thread
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Float>("getBrightnessAsync") {
      val lp = currentActivity.window.attributes
      val brightness = if (lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) {
        // system brightness is not overridden by the current activity, so just resolve with it
        getSystemBrightness()
      } else {
        lp.screenBrightness
      }

      return@AsyncFunction brightness
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Float>("getSystemBrightnessAsync") {
      return@AsyncFunction getSystemBrightness()
    }

    AsyncFunction("setSystemBrightnessAsync") { brightnessValue: Float ->
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (!Settings.System.canWrite(currentActivity)) {
        throw BrightnessPermissionsException()
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
    }

    AsyncFunction<Unit>("restoreSystemBrightnessAsync") {
      val lp = currentActivity.window.attributes
      lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
      currentActivity.window.attributes = lp // must be done on UI thread
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Boolean>("isUsingSystemBrightnessAsync") {
      val lp = currentActivity.window.attributes
      return@AsyncFunction lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Int>("getSystemBrightnessModeAsync") {
      val brightnessMode = Settings.System.getInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE
      )
      return@AsyncFunction brightnessModeNativeToJS(brightnessMode)
    }

    AsyncFunction("setSystemBrightnessModeAsync") { brightnessMode: Int ->
      // we have to just check this every time
      // if we try to store a value for this permission, there is no way to know if the user has changed it
      if (!Settings.System.canWrite(currentActivity)) {
        throw BrightnessPermissionsException()
      }
      Settings.System.putInt(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS_MODE,
        brightnessModeJSToNative(brightnessMode)
      )
    }
  }

  private fun getSystemBrightness(): Float {
    val brightnessMode = Settings.System.getInt(
      currentActivity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS_MODE
    )
    return if (brightnessMode == Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC) {
      val brightness = Settings.System.getFloat(
        currentActivity.contentResolver, // https://stackoverflow.com/questions/29349153/change-adaptive-brightness-level-programatically
        // this setting cannot be changed starting in targetSdkVersion 23, but it can still be read
        "screen_auto_brightness_adj"
      )
      (brightness + 1.0f) / 2
    } else {
      val brightness = Settings.System.getString(
        currentActivity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS
      )
      brightness.toInt() / 255f
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
}
