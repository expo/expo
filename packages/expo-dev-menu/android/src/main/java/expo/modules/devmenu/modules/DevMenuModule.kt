package expo.modules.devmenu.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.devmenu.managers.DevMenuManager

class DevMenuModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenu"

  private val devMenuManger: DevMenuManager by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)
      .getDevMenuManager()
  }

  @ReactMethod
  fun openMenu() {
    reactApplicationContext.currentActivity?.let {
      devMenuManger.openMenu(it)
    }
  }
}
