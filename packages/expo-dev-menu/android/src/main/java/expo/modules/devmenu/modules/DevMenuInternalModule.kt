package expo.modules.devmenu.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

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
}
