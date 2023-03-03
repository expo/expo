package expo.modules.devmenu.modules

import com.facebook.react.bridge.*
import expo.modules.devmenu.DevMenuManager

class DevMenuModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenu"

  private val devMenuManager: DevMenuManager = DevMenuManager

  @ReactMethod
  fun openMenu() {
    reactApplicationContext
      .currentActivity
      ?.run {
        devMenuManager.openMenu(this)
      }
  }

  @ReactMethod
  fun closeMenu() {
    devMenuManager.closeMenu()
  }

  @ReactMethod
  fun hideMenu() {
    devMenuManager.hideMenu()
  }

  override fun invalidate() {
    devMenuManager.registeredCallbacks.clear()
    super.invalidate()
  }

  @ReactMethod
  fun addDevMenuCallbacks(callbacks: ReadableArray, promise: Promise) {
    val size = callbacks.size()
    for (i in 0 until size) {
      val callback = callbacks.getMap(i)
      val name = callback.getString("name") ?: continue
      val shouldCollapse = if (callback.hasKey("shouldCollapse")) {
        callback.getBoolean("shouldCollapse")
      } else {
        true
      }
      devMenuManager.registeredCallbacks.add(DevMenuManager.Callback(name, shouldCollapse))
    }

    return promise.resolve(null)
  }
}
