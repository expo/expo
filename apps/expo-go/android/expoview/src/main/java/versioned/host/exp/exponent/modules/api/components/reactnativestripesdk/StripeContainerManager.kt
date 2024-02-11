package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class StripeContainerManager : ViewGroupManager<StripeContainerView>() {
  override fun getName() = "StripeContainer"

  @ReactProp(name = "keyboardShouldPersistTaps")
  fun setKeyboardShouldPersistTaps(view: StripeContainerView, keyboardShouldPersistTaps: Boolean) {
    view.setKeyboardShouldPersistTaps(keyboardShouldPersistTaps)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): StripeContainerView {
    return StripeContainerView(reactContext)
  }
}
