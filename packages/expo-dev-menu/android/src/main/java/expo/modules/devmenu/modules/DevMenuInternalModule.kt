package expo.modules.devmenu.modules

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import expo.modules.devmenu.managers.DevMenuManager


class DevMenuInternalModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenuInternal"

  @ReactMethod
  fun dispatchActionAsync(actionId: String?, promise: Promise) {
    if (actionId == null) {
      promise.reject("ERR_DEVMENU_ACTION_FAILED", "Action ID not provided.")
      return
    }
    DevMenuManager.dispatchAction(actionId)
    promise.resolve(null)
  }

  @ReactMethod
  fun hideMenu() {
    DevMenuManager.hideMenu()
  }

  @ReactMethod
  fun setOnboardingFinished(finished: Boolean) {
  }

  @ReactMethod
  fun getSettingsAsync(promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putBoolean("motionGestureEnabled", true)
      putBoolean("touchGestureEnabled", true)
      putBoolean("keyCommandsEnabled", true)
      putBoolean("showsAtLaunch", true)
      putBoolean("isOnboardingFinished", true)
    })
  }

  @ReactMethod
  fun setSettingsAsync(settings: ReadableMap, promise: Promise) {
    promise.resolve(null)
  }
}
