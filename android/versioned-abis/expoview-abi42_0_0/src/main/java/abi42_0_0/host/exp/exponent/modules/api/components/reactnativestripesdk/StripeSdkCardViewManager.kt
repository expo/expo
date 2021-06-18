package abi42_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import abi42_0_0.com.facebook.react.bridge.*
import abi42_0_0.com.facebook.react.common.MapBuilder
import abi42_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi42_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi42_0_0.com.facebook.react.uimanager.annotations.ReactProp

const val CARD_FIELD_INSTANCE_NAME = "CardFieldInstance"

class StripeSdkCardViewManager : SimpleViewManager<StripeSdkCardView>() {
  override fun getName() = "CardField"

  private var cardViewInstanceMap: MutableMap<String, Any?> = mutableMapOf()

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      CardFocusEvent.EVENT_NAME, MapBuilder.of("registrationName", "onFocusChange"),
      CardChangedEvent.EVENT_NAME, MapBuilder.of("registrationName", "onCardChange"))
  }

  @ReactProp(name = "dangerouslyGetFullCardDetails")
  fun setDangerouslyGetFullCardDetails(view: StripeSdkCardView, dangerouslyGetFullCardDetails: Boolean = false) {
    view.setDangerouslyGetFullCardDetails(dangerouslyGetFullCardDetails);
  }

  @ReactProp(name = "postalCodeEnabled")
  fun setPostalCodeEnabled(view: StripeSdkCardView, postalCodeEnabled: Boolean = true) {
    view.setPostalCodeEnabled(postalCodeEnabled);
  }

  @ReactProp(name = "autofocus")
  fun setAutofocus(view: StripeSdkCardView, autofocus: Boolean = false) {
    view.setAutofocus(autofocus);
  }

  @ReactProp(name = "cardStyle")
  fun setCardStyle(view: StripeSdkCardView, cardStyle: ReadableMap) {
    view.setCardStyle(cardStyle);
  }

  @ReactProp(name = "placeholder")
  fun setPlaceHolders(view: StripeSdkCardView, placeholder: ReadableMap) {
    view.setPlaceHolders(placeholder);
  }

  override fun createViewInstance(reactContext: ThemedReactContext): StripeSdkCardView {
    // as it's reasonable we handle only one CardField component on the same screen
    // TODO: temporary commented out due to android state persistence and improper behavior after app reload
//    if (cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] != null) {
//      val exceptionManager = reactContext.getNativeModule(ExceptionsManagerModule::class.java)
//      val error: WritableMap = WritableNativeMap()
//      error.putString("message", "Only one CardField component on the same screen allowed")
//      exceptionManager?.reportException(error)
//    }

    cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] = StripeSdkCardView(reactContext)
    return cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] as StripeSdkCardView
  }

  override fun onDropViewInstance(view: StripeSdkCardView) {
    super.onDropViewInstance(view)

    this.cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] = null
  }

  fun getCardViewInstance(): StripeSdkCardView? {
    if (cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] != null) {
      return cardViewInstanceMap[CARD_FIELD_INSTANCE_NAME] as StripeSdkCardView
    }
    return null
  }
}
