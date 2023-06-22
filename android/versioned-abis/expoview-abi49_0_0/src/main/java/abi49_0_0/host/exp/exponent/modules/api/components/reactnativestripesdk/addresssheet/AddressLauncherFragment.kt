package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import abi49_0_0.com.facebook.react.bridge.ReactContext
import abi49_0_0.com.facebook.react.bridge.WritableMap
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.ErrorType
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.addresselement.AddressDetails
import com.stripe.android.paymentsheet.addresselement.AddressLauncher
import com.stripe.android.paymentsheet.addresselement.AddressLauncherResult

class AddressLauncherFragment : Fragment() {
  companion object {
    internal var publishableKey: String? = null
    internal const val TAG = "address_launcher_fragment"
  }

  private lateinit var addressLauncher: AddressLauncher
  private var configuration = AddressLauncher.Configuration()
  private var callback: ((error: WritableMap?, address: AddressDetails?) -> Unit)? = null

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,
                            savedInstanceState: Bundle?): View {
    return FrameLayout(requireActivity()).also {
      it.visibility = View.GONE
    }
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    publishableKey?.let { publishableKey ->
      addressLauncher = AddressLauncher(this,
                                        ::onAddressLauncherResult).also {
        it.present(
          publishableKey = publishableKey,
          configuration = configuration
        )
      }
    } ?: run {
      callback?.invoke(
        createError(ErrorType.Failed.toString(), "No publishable key set. Stripe has not been initialized. Initialize Stripe in your app with the StripeProvider component or the initStripe method."),
        null
      )
    }
  }

  private fun onAddressLauncherResult(result: AddressLauncherResult) {
    when (result) {
      is AddressLauncherResult.Canceled -> {
        callback?.invoke(
          createError(ErrorType.Canceled.toString(), "The flow has been canceled."),
          null
        )
      }
      is AddressLauncherResult.Succeeded -> {
        callback?.invoke(
          null,
          result.address
        )
      }
    }
  }

  fun presentAddressSheet(
    context: ReactContext,
    appearance: PaymentSheet.Appearance,
    defaultAddress: AddressDetails?,
    allowedCountries: Set<String>,
    buttonTitle: String?,
    title: String?,
    googlePlacesApiKey: String?,
    autocompleteCountries: Set<String>,
    additionalFields: AddressLauncher.AdditionalFieldsConfiguration?,
    callback: ((error: WritableMap?, address: AddressDetails?) -> Unit)) {
    configuration = AddressLauncher.Configuration(
      appearance = appearance,
      address = defaultAddress,
      allowedCountries = allowedCountries,
      buttonTitle = buttonTitle,
      additionalFields = additionalFields,
      title = title,
      googlePlacesApiKey = googlePlacesApiKey,
      autocompleteCountries = autocompleteCountries,
    )
    this.callback = callback
    (context.currentActivity as? FragmentActivity)?.let {
      attemptToCleanupPreviousFragment(it)
      commitFragmentAndStartFlow(it)
    }
  }

  private fun attemptToCleanupPreviousFragment(currentActivity: FragmentActivity) {
    currentActivity.supportFragmentManager.beginTransaction()
      .remove(this)
      .commitAllowingStateLoss()
  }

  private fun commitFragmentAndStartFlow(currentActivity: FragmentActivity) {
    try {
      currentActivity.supportFragmentManager.beginTransaction()
        .add(this, TAG)
        .commit()
    } catch (_: IllegalStateException) {}
  }
}
