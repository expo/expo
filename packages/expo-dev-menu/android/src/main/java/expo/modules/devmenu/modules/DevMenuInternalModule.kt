package expo.modules.devmenu.modules

import android.content.Context
import android.content.Intent
import android.graphics.Typeface
import android.net.Uri
import android.os.Build
import androidx.browser.customtabs.CustomTabsIntent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.views.text.ReactFontManager

private var fontsWereLoaded = false

private const val DEV_MENU_STORE = "expo.modules.devmenu.store"

class DevMenuInternalModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenuInternal"

  private val devMenuManger by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)
      .getDevMenuManager()
  }

  private val devMenuSettings by lazy {
    devMenuManger.getSettings()!!
  }

  private val doesDeviceSupportKeyCommands
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")

  private val localStore = reactContext.getSharedPreferences(DEV_MENU_STORE, Context.MODE_PRIVATE)

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
        promise.reject("ERR_DEVMENU_CANNOT_CREATE_FONT", "Couldn't create $familyName font.")
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

  @ReactMethod
  fun onScreenChangeAsync(currentScreen: String?, promise: Promise) {
    devMenuManger.setCurrentScreen(currentScreen)
    promise.resolve(null)
  }

  @ReactMethod
  fun openWebBrowserAsync(startUrl: String?, promise: Promise) {
    requireNotNull(startUrl)

    val intent = createCustomTabsIntent()
    intent.data = Uri.parse(startUrl)

    reactApplicationContext.currentActivity!!.startActivity(intent)
    promise.resolve(null)
  }

  private fun createCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    builder.setShowTitle(false)

    val intent = builder.build().intent

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false)

    return intent
  }

  @ReactMethod
  fun saveAsync(key: String, data: String, promise: Promise) {
    localStore
      .edit()
      .putString(key, data)
      .apply()

    promise.resolve(null)
  }

  @ReactMethod
  fun getAsync(key: String, promise: Promise) {
    promise.resolve(localStore.getString(key, null))
  }
}
