package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.common.MapBuilder
import abi49_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp

class AuBECSDebitFormViewManager : SimpleViewManager<AuBECSDebitFormView>() {
  override fun getName() = "AuBECSDebitForm"

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      FormCompleteEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCompleteAction"))
  }

  @ReactProp(name = "companyName")
  fun setCompanyName(view: AuBECSDebitFormView, name: String?) {
    view.setCompanyName(name)
  }

  @ReactProp(name = "formStyle")
  fun setFormStyle(view: AuBECSDebitFormView, style: ReadableMap) {
    view.setFormStyle(style)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): AuBECSDebitFormView {
    return AuBECSDebitFormView(reactContext)
  }
}
