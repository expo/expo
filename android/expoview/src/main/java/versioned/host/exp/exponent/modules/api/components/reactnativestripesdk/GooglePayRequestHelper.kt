package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.Intent
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.google.android.gms.tasks.Task
import com.google.android.gms.wallet.*
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromPaymentMethod
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromToken
import com.stripe.android.ApiResultCallback
import com.stripe.android.GooglePayJsonFactory
import com.stripe.android.Stripe
import com.stripe.android.model.GooglePayResult
import com.stripe.android.model.PaymentMethod
import com.stripe.android.model.PaymentMethodCreateParams
import org.json.JSONObject
import java.util.*

class GooglePayRequestHelper {
  companion object {
    internal const val LOAD_PAYMENT_DATA_REQUEST_CODE = 414243

    internal fun createPaymentRequest(activity: FragmentActivity, factory: GooglePayJsonFactory, googlePayParams: ReadableMap): Task<PaymentData> {
      val transactionInfo = buildTransactionInfo(googlePayParams)
      val merchantInfo = GooglePayJsonFactory.MerchantInfo(googlePayParams.getString("merchantName").orEmpty())
      val billingAddressParameters = buildBillingAddressParameters(googlePayParams.getMap("billingAddressConfig"))
      val shippingAddressParameters = buildShippingAddressParameters(googlePayParams.getMap("shippingAddressConfig"))

      val request = factory.createPaymentDataRequest(
        transactionInfo = transactionInfo,
        merchantInfo = merchantInfo,
        billingAddressParameters = billingAddressParameters,
        shippingAddressParameters = shippingAddressParameters,
        isEmailRequired = googlePayParams.getBooleanOr("isEmailRequired", false),
        allowCreditCards = googlePayParams.getBooleanOr("allowCreditCards", true)
      )

      val walletOptions =  Wallet.WalletOptions.Builder()
        .setEnvironment(if (googlePayParams.getBoolean("testEnv")) WalletConstants.ENVIRONMENT_TEST else WalletConstants.ENVIRONMENT_PRODUCTION)
        .build()
      return Wallet.getPaymentsClient(activity, walletOptions).loadPaymentData(PaymentDataRequest.fromJson(request.toString()))
    }

    @Suppress("UNCHECKED_CAST")
    private fun buildShippingAddressParameters(params: ReadableMap?): GooglePayJsonFactory.ShippingAddressParameters {
      val isPhoneNumberRequired = params?.getBooleanOr("isPhoneNumberRequired", false)
      val isRequired = params?.getBooleanOr("isRequired", false)
      val allowedCountryCodes = if (params?.hasKey("allowedCountryCodes") == true)
        params.getArray("allowedCountryCodes")?.toArrayList()?.toSet() as? Set<String> else null

      return GooglePayJsonFactory.ShippingAddressParameters(
        isRequired = isRequired ?: false,
        allowedCountryCodes = allowedCountryCodes ?: Locale.getISOCountries().toSet(),
        phoneNumberRequired = isPhoneNumberRequired ?: false
      )
    }

    private fun buildBillingAddressParameters(params: ReadableMap?): GooglePayJsonFactory.BillingAddressParameters {
      val isRequired = params?.getBooleanOr("isRequired", false)
      val isPhoneNumberRequired = params?.getBooleanOr("isPhoneNumberRequired", false)
      val format = when (params?.getString("format").orEmpty()) {
        "FULL" -> GooglePayJsonFactory.BillingAddressParameters.Format.Full
        "MIN" -> GooglePayJsonFactory.BillingAddressParameters.Format.Min
        else -> GooglePayJsonFactory.BillingAddressParameters.Format.Min
      }

      return GooglePayJsonFactory.BillingAddressParameters(
        isRequired = isRequired ?: false,
        format = format,
        isPhoneNumberRequired = isPhoneNumberRequired ?: false
      )
    }

    private fun buildTransactionInfo(params: ReadableMap): GooglePayJsonFactory.TransactionInfo {
      val countryCode = params.getString("merchantCountryCode").orEmpty()
      val currencyCode = params.getString("currencyCode") ?: "USD"
      val amount = params.getInt("amount")

      return GooglePayJsonFactory.TransactionInfo(
        currencyCode = currencyCode,
        totalPriceStatus = GooglePayJsonFactory.TransactionInfo.TotalPriceStatus.Estimated,
        countryCode = countryCode,
        totalPrice = amount,
        checkoutOption = GooglePayJsonFactory.TransactionInfo.CheckoutOption.Default
      )
    }

    internal fun createPaymentMethod(request: Task<PaymentData>, activity: FragmentActivity) {
      AutoResolveHelper.resolveTask(
        request,
        activity,
        LOAD_PAYMENT_DATA_REQUEST_CODE
      )
    }

    internal fun handleGooglePaymentMethodResult(resultCode: Int, data: Intent?, stripe: Stripe, forToken: Boolean, promise: Promise) {
      when (resultCode) {
        Activity.RESULT_OK -> {
          data?.let { intent ->
            PaymentData.getFromIntent(intent)?.let {
              if (forToken) {
                resolveWithToken(it, promise)
              } else {
                resolveWithPaymentMethod(it, stripe, promise)
              }
            }
          }
        }
        Activity.RESULT_CANCELED -> {
          promise.resolve(createError(ErrorType.Canceled.toString(), "The payment has been canceled"))
        }
        AutoResolveHelper.RESULT_ERROR -> {
          AutoResolveHelper.getStatusFromIntent(data)?.let {
            promise.resolve(createError(ErrorType.Failed.toString(), it.statusMessage))
          }
        }
      }
    }

    private fun resolveWithPaymentMethod(paymentData: PaymentData, stripe: Stripe, promise: Promise) {
      val paymentInformation = JSONObject(paymentData.toJson())
      val promiseResult = WritableNativeMap()
      stripe.createPaymentMethod(
        PaymentMethodCreateParams.createFromGooglePay(paymentInformation),
        callback = object : ApiResultCallback<PaymentMethod> {
          override fun onError(e: Exception) {
            promise.resolve(createError("Failed", e))
          }

          override fun onSuccess(result: PaymentMethod) {
            promiseResult.putMap("paymentMethod", mapFromPaymentMethod(result))
            promise.resolve(promiseResult)
          }
        }
      )
    }

    private fun resolveWithToken(paymentData: PaymentData, promise: Promise) {
      val paymentInformation = JSONObject(paymentData.toJson())
      val googlePayResult = GooglePayResult.fromJson(paymentInformation)
      val promiseResult = WritableNativeMap()
      googlePayResult.token?.let {
        promiseResult.putMap("token", mapFromToken(it))
        promise.resolve(promiseResult)
      } ?: run {
        promise.resolve(createError("Failed", "Unexpected response from Google Pay. No token was found."))
      }
    }
  }
}

