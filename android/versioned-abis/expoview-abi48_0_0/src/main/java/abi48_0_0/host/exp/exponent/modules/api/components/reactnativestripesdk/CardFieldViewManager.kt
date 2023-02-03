package abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi48_0_0.com.facebook.react.bridge.ReadableArray
import abi48_0_0.com.facebook.react.bridge.ReadableMap
import abi48_0_0.com.facebook.react.common.MapBuilder
import abi48_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi48_0_0.com.facebook.react.uimanager.annotations.ReactProp

class CardFieldViewManager : SimpleViewManager<CardFieldView>() {
  override fun getName() = "CardField"

  private var reactContextRef: ThemedReactContext? = null

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      CardFocusEvent.EVENT_NAME, MapBuilder.of("registrationName", "onFocusChange"),
      CardChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCardChange")
    )
  }

  override fun receiveCommand(root: CardFieldView, commandId: String?, args: ReadableArray?) {
    when (commandId) {
      "focus" -> root.requestFocusFromJS()
      "blur" -> root.requestBlurFromJS()
      "clear" -> root.requestClearFromJS()
    }
  }

  @ReactProp(name = "dangerouslyGetFullCardDetails")
  fun setDangerouslyGetFullCardDetails(view: CardFieldView, dangerouslyGetFullCardDetails: Boolean = false) {
    view.setDangerouslyGetFullCardDetails(dangerouslyGetFullCardDetails)
  }

  @ReactProp(name = "postalCodeEnabled")
  fun setPostalCodeEnabled(view: CardFieldView, postalCodeEnabled: Boolean = true) {
    view.setPostalCodeEnabled(postalCodeEnabled)
  }

  @ReactProp(name = "autofocus")
  fun setAutofocus(view: CardFieldView, autofocus: Boolean = false) {
    view.setAutofocus(autofocus)
  }

  @ReactProp(name = "cardStyle")
  fun setCardStyle(view: CardFieldView, cardStyle: ReadableMap) {
    view.setCardStyle(cardStyle)
  }

  @ReactProp(name = "countryCode")
  fun setCountryCode(view: CardFieldView, countryCode: String?) {
    view.setCountryCode(countryCode)
  }

  @ReactProp(name = "placeholders")
  fun setPlaceHolders(view: CardFieldView, placeholders: ReadableMap) {
    view.setPlaceHolders(placeholders)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): CardFieldView {
    val stripeSdkModule: StripeSdkModule? = reactContext.getNativeModule(StripeSdkModule::class.java)
    val view = CardFieldView(reactContext)

    reactContextRef = reactContext

    stripeSdkModule?.cardFieldView = view
    return view
  }

  override fun onDropViewInstance(view: CardFieldView) {
    super.onDropViewInstance(view)

    val stripeSdkModule: StripeSdkModule? = reactContextRef?.getNativeModule(StripeSdkModule::class.java)
    stripeSdkModule?.cardFieldView = null
    reactContextRef = null
  }
}
