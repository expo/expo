package expo.modules.devmenu.modules.internals

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableMap
import expo.modules.devmenu.modules.DevMenuInternalMenuControllerModuleInterface
import expo.modules.devmenu.modules.DevMenuManagerProvider

class DevMenuInternalMenuControllerModule(private val reactContext: ReactContext)
  : DevMenuInternalMenuControllerModuleInterface {
  private val devMenuManger by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)
      .getDevMenuManager()
  }

  private val devMenuSettings by lazy {
    devMenuManger.getSettings()!!
  }

  override fun dispatchActionAsync(actionId: String?, promise: Promise) {
    if (actionId == null) {
      promise.reject("ERR_DEVMENU_ACTION_FAILED", "Action ID not provided.")
      return
    }
    devMenuManger.dispatchAction(actionId)
    promise.resolve(null)
  }

  override fun hideMenu() {
    devMenuManger.hideMenu()
  }

  override fun setOnboardingFinished(finished: Boolean) {
    devMenuSettings.isOnboardingFinished = finished
  }

  override fun getSettingsAsync(promise: Promise) = promise.resolve(devMenuSettings.serialize())

  override fun setSettingsAsync(settings: ReadableMap, promise: Promise) {
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

  override fun openDevMenuFromReactNative() {
    devMenuManger.getSession()?.reactInstanceManager?.devSupportManager?.let {
      devMenuManger.closeMenu()
      it.devSupportEnabled = true
      it.showDevOptionsDialog()
    }
  }

  override fun onScreenChangeAsync(currentScreen: String?, promise: Promise) {
    devMenuManger.setCurrentScreen(currentScreen)
    promise.resolve(null)
  }
}
