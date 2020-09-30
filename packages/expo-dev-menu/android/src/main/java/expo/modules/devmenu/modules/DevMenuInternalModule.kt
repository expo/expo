package expo.modules.devmenu.modules

import android.graphics.Typeface
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.text.ReactFontManager

private var fontsWereLoaded = false

class DevMenuInternalModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenuInternal"

  private val devMenuManger by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)
      .getDevMenuManager()
  }

  private val devMenuSettings by lazy {
    reactContext
      .getNativeModule(DevMenuSettings::class.java)
  }

  private val doesDeviceSupportKeyCommands
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "doesDeviceSupportKeyCommands" to doesDeviceSupportKeyCommands
    )
  }

  @ReactMethod
  fun loadFontsAsync(promise: Promise) {
    if (fontsWereLoaded) {
      promise.resolve(null)
      return
    }

    val fonts = mapOf(
      "Material Design Icons" to "MaterialCommunityIcons.ttf",
      "Ionicons" to "Ionicons.ttf"
    )
    val assets = reactApplicationContext.applicationContext.assets
    fonts.map { (familyName, fontFile) ->
      val font = Typeface.createFromAsset(assets, fontFile)
      if (font == null) {
        promise.reject("ERR_DEVMENU_CANNOT_CRAETE_FONT", "Couldn't create $familyName font.")
        return
      }
      ReactFontManager.getInstance().setTypeface(familyName, Typeface.NORMAL, font)
    }

    fontsWereLoaded = true
    promise.resolve(null)
  }

  @ReactMethod
  fun dispatchActionAsync(actionId: String?, promise: Promise) {
    if (actionId == null) {
      promise.reject("ERR_DEVMENU_ACTION_FAILED", "Action ID not provided.")
      return
    }
    devMenuManger.dispatchAction(actionId)
    promise.resolve(null)
  }

  @ReactMethod
  fun hideMenu() {
    devMenuManger.hideMenu()
  }

  @ReactMethod
  fun setOnboardingFinished(finished: Boolean) {
    devMenuSettings.isOnboardingFinished = finished
  }

  @ReactMethod
  fun getSettingsAsync(promise: Promise) = promise.resolve(devMenuSettings.serialize())

  @ReactMethod
  fun setSettingsAsync(settings: ReadableMap, promise: Promise) {
    if (settings.hasKey("motionGestureEnabled")) {
      devMenuSettings.motionGestureEnabled = settings.getBoolean("motionGestureEnabled")
    }

    if (settings.hasKey("keyCommandsEnabled")) {
      devMenuSettings.keyCommandsEnabled = settings.getBoolean("keyCommandsEnabled")
    }

    if (settings.hasKey("showsAtLaunch")) {
      devMenuSettings.showsAtLaunch = settings.getBoolean("showsAtLaunch")
    }

    if (settings.hasKey("touchGestureEnabled")) {
      devMenuSettings.touchGestureEnabled = settings.getBoolean("touchGestureEnabled")
    }

    promise.resolve(null)
  }

  @ReactMethod
  fun openDevMenuFromReactNative() {
    devMenuManger.getSession()?.reactInstanceManager?.devSupportManager?.let {
      devMenuManger.closeMenu()
      it.devSupportEnabled = true
      it.showDevOptionsDialog()
    }
  }
}
