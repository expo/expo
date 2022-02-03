package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi44_0_0.com.facebook.react.bridge.ReadableArray
import abi44_0_0.com.facebook.react.bridge.ReadableMap
import abi44_0_0.com.facebook.react.common.MapBuilder
import abi44_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi44_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi44_0_0.com.facebook.react.uimanager.annotations.ReactProp

class StripeSdkCardViewManager : SimpleViewManager<StripeSdkCardView>() {
  override fun getName() = "CardField"

  private var reactContextRef: ThemedReactContext? = null

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      CardFocusEvent.EVENT_NAME, MapBuilder.of("registrationName", "onFocusChange"),
      CardChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCardChange")
    )
  }

  override fun receiveCommand(root: StripeSdkCardView, commandId: String?, args: ReadableArray?) {
    when (commandId) {
      "focus" -> root.requestFocusFromJS()
      "blur" -> root.requestBlurFromJS()
      "clear" -> root.requestClearFromJS()
    }
  }

  @ReactProp(name = "dangerouslyGetFullCardDetails")
  fun setDangerouslyGetFullCardDetails(view: StripeSdkCardView, dangerouslyGetFullCardDetails: Boolean = false) {
    view.setDangerouslyGetFullCardDetails(dangerouslyGetFullCardDetails)
  }

  @ReactProp(name = "postalCodeEnabled")
  fun setPostalCodeEnabled(view: StripeSdkCardView, postalCodeEnabled: Boolean = true) {
    view.setPostalCodeEnabled(postalCodeEnabled)
  }

  @ReactProp(name = "autofocus")
  fun setAutofocus(view: StripeSdkCardView, autofocus: Boolean = false) {
    view.setAutofocus(autofocus)
  }

  @ReactProp(name = "cardStyle")
  fun setCardStyle(view: StripeSdkCardView, cardStyle: ReadableMap) {
    view.setCardStyle(cardStyle)
  }

  @ReactProp(name = "placeholder")
  fun setPlaceHolders(view: StripeSdkCardView, placeholder: ReadableMap) {
    view.setPlaceHolders(placeholder)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): StripeSdkCardView {
    val stripeSdkModule: StripeSdkModule? = reactContext.getNativeModule(StripeSdkModule::class.java)
    val view = StripeSdkCardView(reactContext)

    reactContextRef = reactContext

    stripeSdkModule?.cardFieldView = view
    return view
  }

  override fun onDropViewInstance(view: StripeSdkCardView) {
    super.onDropViewInstance(view)

    val stripeSdkModule: StripeSdkModule? = reactContextRef?.getNativeModule(StripeSdkModule::class.java)
    stripeSdkModule?.cardFieldView = null
    reactContextRef = null
  }
}
