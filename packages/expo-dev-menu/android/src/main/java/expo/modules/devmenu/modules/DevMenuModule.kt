package expo.modules.devmenu.modules

import com.facebook.react.bridge.*
import expo.modules.devmenu.DevMenuManager

class DevMenuModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenu"

  private val devMenuManager: DevMenuManager = DevMenuManager

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

  override fun invalidate() {
    devMenuManager.registeredCallbacks = arrayListOf<String>()
    super.invalidate()
  }

  @ReactMethod
  fun addDevMenuCallbacks(names: ReadableArray, promise: Promise) {
    devMenuManager.registeredCallbacks = names.toArrayList() as ArrayList<String>

    return promise.resolve(null)
  }
}
