package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet

import android.os.Bundle
import android.util.Log
import android.widget.FrameLayout
import abi49_0_0.com.facebook.react.bridge.ReadableMap
import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.com.facebook.react.bridge.WritableNativeMap
import abi49_0_0.com.facebook.react.uimanager.ThemedReactContext
import abi49_0_0.com.facebook.react.uimanager.UIManagerModule
import abi49_0_0.com.facebook.react.uimanager.events.EventDispatcher
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.buildPaymentSheetAppearance
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.ErrorType
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.PaymentSheetAppearanceException
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.toBundleObject
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.addresselement.AddressDetails
import com.stripe.android.paymentsheet.addresselement.AddressLauncher

class AddressSheetView(private val context: ThemedReactContext) : FrameLayout(context) {
  private var eventDispatcher: EventDispatcher? = context.getNativeModule(UIManagerModule::class.java)?.eventDispatcher
  private var isVisible = false
  private var appearanceParams: ReadableMap? = null
  private var defaultAddress: AddressDetails? = null
  private var allowedCountries: Set<String> = emptySet()
  private var buttonTitle: String? = null
  private var sheetTitle: String? = null
  private var googlePlacesApiKey: String? = null
  private var autocompleteCountries: Set<String> = emptySet()
  private var additionalFields: AddressLauncher.AdditionalFieldsConfiguration? = null

  private fun onSubmit(params: WritableMap) {
    eventDispatcher?.dispatchEvent(
      AddressSheetEvent(id, AddressSheetEvent.EventType.OnSubmit, params)
    )
  }

  private fun onError(params: WritableMap?) {
    eventDispatcher?.dispatchEvent(
      AddressSheetEvent(id, AddressSheetEvent.EventType.OnError, params)
    )
  }

  fun setVisible(newVisibility: Boolean) {
    if (newVisibility && !isVisible) {
      launchAddressSheet()
    } else if (!newVisibility && isVisible) {
      Log.w("StripeReactNative", "Programmatically dismissing the Address Sheet is not supported on Android.")
    }
    isVisible = newVisibility
  }

  private fun launchAddressSheet() {
    val appearance = try {
      buildPaymentSheetAppearance(toBundleObject(appearanceParams), context)
    } catch (error: PaymentSheetAppearanceException) {
      onError(createError(ErrorType.Failed.toString(), error))
      return
    }
    AddressLauncherFragment().presentAddressSheet(
      context,
      appearance,
      defaultAddress,
      allowedCountries,
      buttonTitle,
      sheetTitle,
      googlePlacesApiKey,
      autocompleteCountries,
      additionalFields
    ) { error, address ->
      if (address != null) {
        onSubmit(buildResult(address))
      } else {
        onError(error)
      }
      isVisible = false
    }
  }

  fun setAppearance(appearanceParams: ReadableMap) {
    this.appearanceParams = appearanceParams
  }

  fun setDefaultValues(defaults: ReadableMap) {
    defaultAddress = buildAddressDetails(defaults)
  }

  fun setAdditionalFields(fields: ReadableMap) {
    additionalFields = buildAdditionalFieldsConfiguration(fields)
  }

  fun setAllowedCountries(countries: List<String>) {
    allowedCountries = countries.toSet()
  }

  fun setAutocompleteCountries(countries: List<String>) {
    autocompleteCountries = countries.toSet()
  }

  fun setPrimaryButtonTitle(title: String) {
    buttonTitle = title
  }

  fun setSheetTitle(title: String) {
    sheetTitle = title
  }

  fun setGooglePlacesApiKey(key: String) {
    googlePlacesApiKey = key
  }

  companion object {
    internal fun buildAddressDetails(bundle: Bundle): AddressDetails {
      return AddressDetails(
        name = bundle.getString("name"),
        address = buildAddress(bundle.getBundle("address")),
        phoneNumber = bundle.getString("phone"),
        isCheckboxSelected = bundle.getBoolean("isCheckboxSelected"),
      )
    }

    internal fun buildAddressDetails(map: ReadableMap): AddressDetails {
      return buildAddressDetails(toBundleObject(map))
    }

    internal fun buildAddress(bundle: Bundle?): PaymentSheet.Address? {
      if (bundle == null) {
        return null
      }
      return PaymentSheet.Address(
        city = bundle.getString("city"),
        country = bundle.getString("country"),
        line1 = bundle.getString("line1"),
        line2 = bundle.getString("line2"),
        state = bundle.getString("state"),
        postalCode = bundle.getString("postalCode")
      )
    }

    internal fun getFieldConfiguration(key: String?): AddressLauncher.AdditionalFieldsConfiguration.FieldConfiguration {
      return when (key) {
        "hidden" -> AddressLauncher.AdditionalFieldsConfiguration.FieldConfiguration.HIDDEN
        "optional" -> AddressLauncher.AdditionalFieldsConfiguration.FieldConfiguration.OPTIONAL
        "required" -> AddressLauncher.AdditionalFieldsConfiguration.FieldConfiguration.REQUIRED
        else -> AddressLauncher.AdditionalFieldsConfiguration.FieldConfiguration.HIDDEN
      }
    }

    internal fun buildAdditionalFieldsConfiguration(params: ReadableMap): AddressLauncher.AdditionalFieldsConfiguration {
      val phoneConfiguration = getFieldConfiguration(params.getString("phoneNumber"))

      return AddressLauncher.AdditionalFieldsConfiguration(
        phone = phoneConfiguration,
        checkboxLabel = params.getString("checkboxLabel")
      )
    }

    internal fun buildResult(addressDetails: AddressDetails): WritableMap {
      val result = WritableNativeMap()
      result.putString("name", addressDetails.name)
      WritableNativeMap().let {
        it.putString("city", addressDetails.address?.city)
        it.putString("country", addressDetails.address?.country)
        it.putString("line1", addressDetails.address?.line1)
        it.putString("line2", addressDetails.address?.line2)
        it.putString("postalCode", addressDetails.address?.postalCode)
        it.putString("state", addressDetails.address?.state)
        result.putMap("address", it)
      }
      result.putString("phone", addressDetails.phoneNumber)
      result.putBoolean("isCheckboxSelected", addressDetails.isCheckboxSelected ?: false)
      return result
    }
  }
}
