package expo.modules.devmenu.modules.internals

import android.graphics.Typeface
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.views.text.ReactFontManager
import expo.modules.devmenu.modules.DevMenuInternalFontManagerModuleInterface

private var fontsWereLoaded = false

class DevMenuInternalFontManagerModule(private val reactContext: ReactApplicationContext) :
  DevMenuInternalFontManagerModuleInterface {
  override fun loadFontsAsync(promise: Promise) {
    if (fontsWereLoaded) {
      promise.resolve(null)
      return
    }

    val fonts = mapOf(
      "Material Design Icons" to "MaterialCommunityIcons.ttf",
      "Ionicons" to "Ionicons.ttf"
    )

    val assets = reactContext.applicationContext.assets
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
}
