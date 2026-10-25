package expo.modules.selectabletext

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ExpoSelectableTextPackage : ReactPackage {
  override fun createViewManagers(
    reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> = listOf(ExpoSelectableTextViewManager())
}
