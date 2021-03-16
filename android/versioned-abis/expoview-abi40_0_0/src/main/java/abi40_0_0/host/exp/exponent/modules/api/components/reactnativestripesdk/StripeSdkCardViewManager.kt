package abi40_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi40_0_0.com.facebook.react.bridge.ReadableMap
import abi40_0_0.com.facebook.react.common.MapBuilder
import abi40_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi40_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi40_0_0.com.facebook.react.uimanager.annotations.ReactProp


class StripeSdkCardViewManager : SimpleViewManager<StripeSdkCardView>() {
  override fun getName() = "CardField"

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      CardFocusEvent.EVENT_NAME, MapBuilder.of("registrationName", "onFocus"),
      CardChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCardChange"))
  }

  private fun isNotEmptyField(field: Any?): Boolean {
    return (field as CharSequence).isNotEmpty()
  }

  @ReactProp(name = "postalCodeEnabled")
  fun setPostalCodeEnabled(view: StripeSdkCardView, postalCodeEnabled: Boolean) {
    view.setPostalCodeEnabled(postalCodeEnabled);
  }

  override fun createViewInstance(reactContext: ThemedReactContext): StripeSdkCardView {
    return StripeSdkCardView(reactContext)
  }
}
