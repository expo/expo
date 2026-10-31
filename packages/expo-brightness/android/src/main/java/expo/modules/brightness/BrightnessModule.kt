package expo.modules.brightness

import android.Manifest
import android.app.Activity
import android.provider.Settings
import android.view.WindowManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.currentActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlin.math.roundToInt

const val brightnessChangeEvent = "Expo.brightnessDidChange"

@Record
internal data class BrightnessChangeEvent(val brightness: Float)

@ExpoModule("ExpoBrightness")
class BrightnessModule : Module() {
  private val activity: Activity
    get() = currentActivity ?: throw Exceptions.MissingActivity()

  // This is never emitted on Android. JavaScript can only subscribe to a declared event.
  @Event(name = brightnessChangeEvent)
  private val onBrightnessChange = event<BrightnessChangeEvent>()

  @JS
  fun requestPermissionsAsync(): Promise<Map<String, Any?>> = legacyPermissionsPromise { promise ->
    Permissions.askForPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.WRITE_SETTINGS)
  }

  @JS
  fun getPermissionsAsync(): Promise<Map<String, Any?>> = legacyPermissionsPromise { promise ->
    Permissions.getPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.WRITE_SETTINGS)
  }

  @JS
  suspend fun setBrightnessAsync(brightnessValue: Float): Unit = withContext(Dispatchers.Main) {
    val lp = activity.window.attributes
    lp.screenBrightness = brightnessValue
    activity.window.attributes = lp // must be done on UI thread
  }

  @JS
  suspend fun getBrightnessAsync(): Float = withContext(Dispatchers.Main) {
    val lp = activity.window.attributes
    if (lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE) {
      // system brightness is not overridden by the current activity, so just resolve with it
      getSystemBrightness()
    } else {
      lp.screenBrightness
    }
  }

  @JS
  suspend fun getSystemBrightnessAsync(): Float = withContext(Dispatchers.IO) {
    getSystemBrightness()
  }

  @JS
  suspend fun setSystemBrightnessAsync(brightnessValue: Float): Unit = withContext(Dispatchers.IO) {
    // we have to just check this every time
    // if we try to store a value for this permission, there is no way to know if the user has changed it
    if (!Settings.System.canWrite(activity)) {
      throw BrightnessPermissionsException()
    }
    // manual mode must be set in order to change system brightness (sets the automatic mode off)
    Settings.System.putInt(
      activity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS_MODE,
      Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL
    )
    // Android's SCREEN_BRIGHTNESS accepts values from 1 to 255 (not 0 to 255)
    // Map input range [0, 1] to Android's valid range [1, 255]
    Settings.System.putInt(
      activity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS,
      (brightnessValue * 254 + 1).roundToInt()
    )
  }

  @JS
  suspend fun restoreSystemBrightnessAsync(): Unit = withContext(Dispatchers.Main) {
    val lp = activity.window.attributes
    lp.screenBrightness = WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
    activity.window.attributes = lp // must be done on UI thread
  }

  @JS
  suspend fun isUsingSystemBrightnessAsync(): Boolean = withContext(Dispatchers.Main) {
    val lp = activity.window.attributes
    lp.screenBrightness == WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
  }

  @JS
  suspend fun getSystemBrightnessModeAsync(): Int = withContext(Dispatchers.IO) {
    val brightnessMode = Settings.System.getInt(
      activity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS_MODE
    )
    brightnessModeNativeToJS(brightnessMode)
  }

  @JS
  suspend fun setSystemBrightnessModeAsync(brightnessMode: Int): Unit = withContext(Dispatchers.IO) {
    // we have to just check this every time
    // if we try to store a value for this permission, there is no way to know if the user has changed it
    if (!Settings.System.canWrite(activity)) {
      throw BrightnessPermissionsException()
    }
    Settings.System.putInt(
      activity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS_MODE,
      brightnessModeJSToNative(brightnessMode)
    )
  }

  private fun getSystemBrightness(): Float {
    val brightnessMode = Settings.System.getInt(
      activity.contentResolver,
      Settings.System.SCREEN_BRIGHTNESS_MODE
    )
    return if (brightnessMode == Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC) {
      val brightness = Settings.System.getFloat(
        activity.contentResolver, // https://stackoverflow.com/questions/29349153/change-adaptive-brightness-level-programatically
        // this setting cannot be changed starting in targetSdkVersion 23, but it can still be read
        "screen_auto_brightness_adj"
      )
      (brightness + 1.0f) / 2
    } else {
      val brightness = Settings.System.getString(
        activity.contentResolver,
        Settings.System.SCREEN_BRIGHTNESS
      )
      // Map Android's range [1, 255] back to [0, 1]
      (brightness.toInt() - 1) / 254f
    }
  }

  private fun brightnessModeNativeToJS(nativeValue: Int): Int {
    return when (nativeValue) {
      Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC -> 1
      Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL -> 2
      else -> 0
    }
  }

  @Throws(UnsupportedBrightnessModeException::class)
  private fun brightnessModeJSToNative(jsValue: Int): Int {
    return when (jsValue) {
      1 -> Settings.System.SCREEN_BRIGHTNESS_MODE_AUTOMATIC
      2 -> Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL
      else -> throw UnsupportedBrightnessModeException(jsValue)
    }
  }
}
