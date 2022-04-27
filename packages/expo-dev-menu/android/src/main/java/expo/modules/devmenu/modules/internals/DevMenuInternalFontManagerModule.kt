package expo.modules.devmenu.modules.internals

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.modules.DevMenuInternalFontManagerModuleInterface

class DevMenuInternalFontManagerModule(private val reactContext: ReactApplicationContext) :
  DevMenuInternalFontManagerModuleInterface {
  override fun loadFontsAsync(promise: Promise) {
    DevMenuManager.loadFonts(reactContext)
    promise.resolve(null)
  }
}
