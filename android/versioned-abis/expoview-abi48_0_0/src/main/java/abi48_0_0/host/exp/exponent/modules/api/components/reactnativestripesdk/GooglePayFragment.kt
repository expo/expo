package abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import abi48_0_0.com.facebook.react.bridge.Promise
import abi48_0_0.com.facebook.react.bridge.WritableNativeMap
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.GooglePayErrorType
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createResult
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromPaymentMethod
import com.stripe.android.googlepaylauncher.GooglePayEnvironment
import com.stripe.android.googlepaylauncher.GooglePayLauncher
import com.stripe.android.googlepaylauncher.GooglePayPaymentMethodLauncher

class GooglePayFragment(private val initPromise: Promise) : Fragment() {
  private var googlePayLauncher: GooglePayLauncher? = null
  private var googlePayMethodLauncher: GooglePayPaymentMethodLauncher? = null
  private var isGooglePayMethodLauncherReady: Boolean = false
  private var isGooglePayLauncherReady: Boolean = false
  private var presentPromise: Promise? = null
  private var createPaymentMethodPromise: Promise? = null

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    return FrameLayout(requireActivity()).also {
      it.visibility = View.GONE
    }
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    val testEnv = arguments?.getBoolean("testEnv")
    val merchantName = arguments?.getString("merchantName").orEmpty()
    val countryCode = arguments?.getString("countryCode").orEmpty()
    val isEmailRequired = arguments?.getBoolean("isEmailRequired") ?: false
    val existingPaymentMethodRequired = arguments?.getBoolean("existingPaymentMethodRequired") ?: false

    val billingAddressConfigBundle = arguments?.getBundle("billingAddressConfig") ?: Bundle()
    val isRequired = billingAddressConfigBundle.getBoolean("isRequired")
    val formatString = billingAddressConfigBundle.getString("format").orEmpty()
    val isPhoneNumberRequired = billingAddressConfigBundle.getBoolean("isPhoneNumberRequired")

    val billingAddressConfig = mapToGooglePayPaymentMethodLauncherBillingAddressConfig(formatString, isRequired, isPhoneNumberRequired)

    googlePayMethodLauncher = GooglePayPaymentMethodLauncher(
      fragment = this,
      config = GooglePayPaymentMethodLauncher.Config(
        environment = if (testEnv == true) GooglePayEnvironment.Test else GooglePayEnvironment.Production,
        merchantCountryCode = countryCode,
        merchantName = merchantName,
        billingAddressConfig = billingAddressConfig,
        isEmailRequired = isEmailRequired,
        existingPaymentMethodRequired = existingPaymentMethodRequired
      ),
      readyCallback = ::onGooglePayMethodLauncherReady,
      resultCallback = ::onGooglePayResult
    )

    val paymentMethodBillingAddressConfig = mapToGooglePayLauncherBillingAddressConfig(formatString, isRequired, isPhoneNumberRequired)
    googlePayLauncher = GooglePayLauncher(
      fragment = this,
      config = GooglePayLauncher.Config(
        environment = if (testEnv == true) GooglePayEnvironment.Test else GooglePayEnvironment.Production,
        merchantCountryCode = countryCode,
        merchantName = merchantName,
        billingAddressConfig = paymentMethodBillingAddressConfig,
        isEmailRequired = isEmailRequired,
        existingPaymentMethodRequired = existingPaymentMethodRequired
      ),
      readyCallback = ::onGooglePayLauncherReady,
      resultCallback = ::onGooglePayResult
    )
  }

  private fun onGooglePayMethodLauncherReady(isReady: Boolean) {
    isGooglePayMethodLauncherReady = true
    if (isGooglePayLauncherReady) {
      onGooglePayReady(isReady)
    }
  }

  private fun onGooglePayLauncherReady(isReady: Boolean) {
    isGooglePayLauncherReady = true
    if (isGooglePayMethodLauncherReady) {
      onGooglePayReady(isReady)
    }
  }

  private fun onGooglePayReady(isReady: Boolean) {
    if (isReady) {
      initPromise.resolve(WritableNativeMap())
    } else {
      initPromise.resolve(
        createError(
          GooglePayErrorType.Failed.toString(),
          "Google Pay is not available on this device. You can use isGooglePaySupported to preemptively check for Google Pay support."
        )
      )
    }
  }

  fun presentForPaymentIntent(clientSecret: String, promise: Promise) {
    val launcher = googlePayLauncher ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "GooglePay is not initialized."))
      return
    }
    runCatching {
      presentPromise = promise
      launcher.presentForPaymentIntent(clientSecret)
    }.onFailure {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), it))
    }
  }

  fun presentForSetupIntent(clientSecret: String, currencyCode: String, promise: Promise) {
    val launcher = googlePayLauncher ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "GooglePay is not initialized."))
      return
    }
    runCatching {
      presentPromise = promise
      launcher.presentForSetupIntent(clientSecret, currencyCode)
    }.onFailure {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), it))
    }
  }

  fun createPaymentMethod(currencyCode: String, amount: Int, promise: Promise) {
    val launcher = googlePayMethodLauncher ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "GooglePayPaymentMethodLauncher is not initialized."))
      return
    }

    runCatching {
      createPaymentMethodPromise = promise
      launcher.present(
        currencyCode = currencyCode,
        amount = amount
      )
    }.onFailure {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), it))
    }
  }

  private fun onGooglePayResult(result: GooglePayLauncher.Result) {
    when (result) {
      GooglePayLauncher.Result.Completed -> {
        presentPromise?.resolve(WritableNativeMap())
      }
      GooglePayLauncher.Result.Canceled -> {
        presentPromise?.resolve(createError(GooglePayErrorType.Canceled.toString(), "Google Pay has been canceled"))
      }
      is GooglePayLauncher.Result.Failed -> {
        presentPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), result.error))
      }
    }
    presentPromise = null
  }

  private fun onGooglePayResult(result: GooglePayPaymentMethodLauncher.Result) {
    when (result) {
      is GooglePayPaymentMethodLauncher.Result.Completed -> {
        createPaymentMethodPromise?.resolve(createResult("paymentMethod", mapFromPaymentMethod(result.paymentMethod)))
      }
      GooglePayPaymentMethodLauncher.Result.Canceled -> {
        createPaymentMethodPromise?.resolve(createError(GooglePayErrorType.Canceled.toString(), "Google Pay has been canceled"))
      }
      is GooglePayPaymentMethodLauncher.Result.Failed -> {
        createPaymentMethodPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), result.error))
      }
    }
    createPaymentMethodPromise = null
  }

  private fun mapToGooglePayLauncherBillingAddressConfig(formatString: String, isRequired: Boolean, isPhoneNumberRequired: Boolean): GooglePayLauncher.BillingAddressConfig {
    val format = when (formatString) {
      "FULL" -> GooglePayLauncher.BillingAddressConfig.Format.Full
      "MIN" -> GooglePayLauncher.BillingAddressConfig.Format.Min
      else -> GooglePayLauncher.BillingAddressConfig.Format.Min
    }
    return GooglePayLauncher.BillingAddressConfig(
      isRequired = isRequired,
      format = format,
      isPhoneNumberRequired = isPhoneNumberRequired
    )
  }

  private fun mapToGooglePayPaymentMethodLauncherBillingAddressConfig(formatString: String, isRequired: Boolean, isPhoneNumberRequired: Boolean): GooglePayPaymentMethodLauncher.BillingAddressConfig {
    val format = when (formatString) {
      "FULL" -> GooglePayPaymentMethodLauncher.BillingAddressConfig.Format.Full
      "MIN" -> GooglePayPaymentMethodLauncher.BillingAddressConfig.Format.Min
      else -> GooglePayPaymentMethodLauncher.BillingAddressConfig.Format.Min
    }
    return GooglePayPaymentMethodLauncher.BillingAddressConfig(
      isRequired = isRequired,
      format = format,
      isPhoneNumberRequired = isPhoneNumberRequired
    )
  }

  companion object {
    internal const val TAG = "google_pay_launch_fragment"
  }
}
