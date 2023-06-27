package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet

import abi49_0_0.com.facebook.react.bridge.ReadableArray
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.common.MapBuilder
import abi49_0_0.com.facebook.react.uimanager.SimpleViewManager
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.annotations.ReactProp

class AddressSheetViewManager : SimpleViewManager<AddressSheetView>() {
  override fun getName() = "AddressSheetView"

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> {
    return MapBuilder.of(
      AddressSheetEvent.ON_SUBMIT, MapBuilder.of("registrationName", "onSubmitAction"),
      AddressSheetEvent.ON_ERROR, MapBuilder.of("registrationName", "onErrorAction")
    )
  }

  @ReactProp(name = "visible")
  fun setVisible(view: AddressSheetView, visibility: Boolean) {
    view.setVisible(visibility)
  }

  @ReactProp(name = "appearance")
  fun setAppearance(view: AddressSheetView, appearance: ReadableMap) {
    view.setAppearance(appearance)
  }

  @ReactProp(name = "defaultValues")
  fun setDefaultValues(view: AddressSheetView, defaults: ReadableMap) {
    view.setDefaultValues(defaults)
  }

  @ReactProp(name = "additionalFields")
  fun setAdditionalFields(view: AddressSheetView, fields: ReadableMap) {
    view.setAdditionalFields(fields)
  }

  @ReactProp(name = "allowedCountries")
  fun setAllowedCountries(view: AddressSheetView, countries: ReadableArray) {
    view.setAllowedCountries(countries.toArrayList().filterIsInstance<String>())
  }

  @ReactProp(name = "autocompleteCountries")
  fun setAutocompleteCountries(view: AddressSheetView, countries: ReadableArray) {
    view.setAutocompleteCountries(countries.toArrayList().filterIsInstance<String>())
  }

  @ReactProp(name = "primaryButtonTitle")
  fun setPrimaryButtonTitle(view: AddressSheetView, title: String) {
    view.setPrimaryButtonTitle(title)
  }

  @ReactProp(name = "sheetTitle")
  fun setSheetTitle(view: AddressSheetView, title: String) {
    view.setSheetTitle(title)
  }

  @ReactProp(name = "googlePlacesApiKey")
  fun setGooglePlacesApiKey(view: AddressSheetView, key: String) {
    view.setGooglePlacesApiKey(key)
  }

  override fun createViewInstance(reactContext: ThemedReactContext): AddressSheetView {
    return AddressSheetView(reactContext)
  }
}
