package expo.modules.devmenu.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DevMenuModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenu"

  private val devMenuManager by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)
      .getDevMenuManager()
  }

  private fun openMenuOn(screen: String?) {
    reactApplicationContext
      .currentActivity
      ?.run {
        devMenuManager.openMenu(this, screen)
      }
  }

  @ReactMethod
  fun openMenu() {
    openMenuOn(null)
  }

  @ReactMethod
  fun openProfile() {
    openMenuOn("Profile")
  }

  @ReactMethod
  fun openSettings() {
    openMenuOn("Settings")
  }
}
