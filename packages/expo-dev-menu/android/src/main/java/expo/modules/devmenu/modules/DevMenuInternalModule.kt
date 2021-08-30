package expo.modules.devmenu.modules

import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import expo.modules.devmenu.modules.internals.DevMenuInternalFontManagerModule
import expo.modules.devmenu.modules.internals.DevMenuInternalMenuControllerModule
import expo.modules.devmenu.modules.internals.DevMenuInternalSessionManagerModule
import expo.modules.devmenu.modules.internals.DevMenuInternalWebBrowserModule

interface DevMenuInternalMenuControllerModuleInterface {
  @ReactMethod
  fun dispatchCallableAsync(callableId: String?, args: ReadableMap?, promise: Promise)

  @ReactMethod
  fun hideMenu()

  @ReactMethod
  fun setOnboardingFinished(finished: Boolean)

  @ReactMethod
  fun getSettingsAsync(promise: Promise)

  @ReactMethod
  fun setSettingsAsync(settings: ReadableMap, promise: Promise)

  @ReactMethod
  fun openDevMenuFromReactNative()

  @ReactMethod
  fun onScreenChangeAsync(currentScreen: String?, promise: Promise)

  @ReactMethod
  fun fetchDataSourceAsync(id: String?, promise: Promise)
}

interface DevMenuInternalSessionManagerModuleInterface {
  fun restoreSession(): String?

  @ReactMethod
  fun restoreSessionAsync(promise: Promise)

  @ReactMethod
  fun setSessionAsync(session: ReadableMap?, promise: Promise)
}

interface DevMenuInternalFontManagerModuleInterface {
  @ReactMethod
  fun loadFontsAsync(promise: Promise)
}

interface DevMenuInternalWebBrowserModuleInterface {
  @ReactMethod
  fun openWebBrowserAsync(startUrl: String?, promise: Promise)
}

class DevMenuInternalModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext),
  DevMenuInternalFontManagerModuleInterface by DevMenuInternalFontManagerModule(reactContext),
  DevMenuInternalWebBrowserModuleInterface by DevMenuInternalWebBrowserModule(reactContext),
  DevMenuInternalSessionManagerModuleInterface by DevMenuInternalSessionManagerModule(reactContext),
  DevMenuInternalMenuControllerModuleInterface by DevMenuInternalMenuControllerModule(reactContext) {

  override fun initialize() {
    restoreSession()
  }
  override fun getName() = "ExpoDevMenuInternal"

  private val doesDeviceSupportKeyCommands
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")

  override fun getConstants(): Map<String, Any> {
    return mapOf(
      "doesDeviceSupportKeyCommands" to doesDeviceSupportKeyCommands
    )
  }
}
