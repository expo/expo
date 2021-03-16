package abi40_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.Intent
import android.os.AsyncTask
import abi40_0_0.com.facebook.react.bridge.*
import com.stripe.android.*
import com.stripe.android.model.*

class StripeSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "StripeSdk"
  }

  private var onConfirmPaymentError: Callback? = null
  private var onConfirmPaymentSuccess: Callback? = null
  private var onConfirmSetupIntentError: Callback? = null
  private var onConfirmSetupIntentSuccess: Callback? = null
  private var confirmPromise: Promise? = null
  private var handleCardActionPromise: Promise? = null
  private var confirmSetupIntentPromise: Promise? = null

  private val mActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent) {
      stripe.onSetupResult(requestCode, data, object : ApiResultCallback<SetupIntentResult> {
        override fun onSuccess(result: SetupIntentResult) {
          val setupIntent = result.intent
          when (setupIntent.status) {
            StripeIntent.Status.Succeeded -> {
              onConfirmSetupIntentSuccess?.invoke(mapFromSetupIntentResult(setupIntent))
              confirmSetupIntentPromise?.resolve(mapFromSetupIntentResult(setupIntent))
            }
            StripeIntent.Status.Canceled -> {
              val errorMessage = setupIntent.lastSetupError?.message.orEmpty()
              onConfirmSetupIntentError?.invoke(createError(ConfirmSetupIntentErrorType.Canceled.toString(), errorMessage))
              confirmSetupIntentPromise?.reject(ConfirmSetupIntentErrorType.Canceled.toString(), errorMessage)
            }
            else -> {
              val errorMessage = "unhandled error: ${setupIntent.status}"
              onConfirmSetupIntentError?.invoke(createError(ConfirmSetupIntentErrorType.Unknown.toString(), errorMessage))
              confirmSetupIntentPromise?.reject(ConfirmSetupIntentErrorType.Unknown.toString(), errorMessage)
            }
          }
        }
        override fun onError(e: Exception) {
          onConfirmSetupIntentError?.invoke(createError(ConfirmSetupIntentErrorType.Failed.toString(), e.message.orEmpty()))
          confirmSetupIntentPromise?.reject(ConfirmSetupIntentErrorType.Failed.toString(), e.message.orEmpty())
        }
      })

      stripe.onPaymentResult(requestCode, data, object : ApiResultCallback<PaymentIntentResult> {
        override fun onSuccess(result: PaymentIntentResult) {
          val paymentIntent = result.intent

          when (paymentIntent.status) {
            StripeIntent.Status.Succeeded -> {
              confirmPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
              handleCardActionPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
              onConfirmPaymentSuccess?.invoke(mapFromPaymentIntentResult(paymentIntent))
            }
            StripeIntent.Status.RequiresPaymentMethod -> {
              val errorMessage = paymentIntent.lastPaymentError?.message.orEmpty()
              onConfirmPaymentError?.invoke(createError(ConfirmPaymentErrorType.Failed.toString(), errorMessage))
              confirmPromise?.reject(ConfirmPaymentErrorType.Failed.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Failed.toString(), errorMessage)
            }
            StripeIntent.Status.RequiresConfirmation -> {
              handleCardActionPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
            }
            StripeIntent.Status.Canceled -> {
              val errorMessage = paymentIntent.lastPaymentError?.message.orEmpty()
              onConfirmPaymentError?.invoke(createError(ConfirmPaymentErrorType.Canceled.toString(), errorMessage))
              confirmPromise?.reject(ConfirmPaymentErrorType.Canceled.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Canceled.toString(), errorMessage)
            }
            else -> {
              val errorMessage = "unhandled error: ${paymentIntent.status}"
              onConfirmPaymentError?.invoke(createError(ConfirmPaymentErrorType.Unknown.toString(), errorMessage))
              confirmPromise?.reject(ConfirmPaymentErrorType.Unknown.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Unknown.toString(), errorMessage)
            }
          }
        }

        override fun onError(e: Exception) {
          onConfirmPaymentError?.invoke(e.toString())
          confirmPromise?.reject(ConfirmPaymentErrorType.Failed.toString(), e.toString())
          handleCardActionPromise?.reject(NextPaymentActionErrorType.Failed.toString(), e.toString())
        }
      })
    }
  }

  private lateinit var stripe: Stripe

  init {
    reactContext.addActivityEventListener(mActivityEventListener);
  }

  private fun configure3dSecure(params: ReadableMap) {
    val stripe3dsConfigBuilder = PaymentAuthConfig.Stripe3ds2Config.Builder()

    if (params.hasKey("timeout")) stripe3dsConfigBuilder.setTimeout(params.getInt("timeout"))

    val uiCustomization = mapToUICustomization(params)

    PaymentAuthConfig.init(
      PaymentAuthConfig.Builder()
        .set3ds2Config(
          stripe3dsConfigBuilder
            .setUiCustomization(uiCustomization)
            .build()
        )
        .build()
    )
  }

  @ReactMethod
  fun initialise(publishableKey: String, appInfo: ReadableMap, stripeAccountId: String?, params: ReadableMap?) {
    if (params != null) {
      configure3dSecure(params)
    }

    val name = getValOr(appInfo, "name", "") as String
    val partnerId = getValOr(appInfo, "partnerId", "")
    val version = getValOr(appInfo, "version", "")

    val url = getValOr(appInfo, "url", "")
    Stripe.appInfo = AppInfo.create(name, version, url, partnerId)
    stripe = Stripe(reactApplicationContext, publishableKey, stripeAccountId)
  }

  @ReactMethod
  fun createPaymentMethod(data: ReadableMap, options: ReadableMap, promise: Promise) {
    val cardDetails = data.getMap("cardDetails") as ReadableMap
    val paymentMethodCreateParams = mapToPaymentMethodCreateParams(cardDetails)
    stripe.createPaymentMethod(
      paymentMethodCreateParams,
      callback = object : ApiResultCallback<PaymentMethod> {
        override fun onError(e: Exception) {
          confirmPromise?.reject("Failed", e.localizedMessage)
        }

        override fun onSuccess(result: PaymentMethod) {
          val paymentMethodMap: WritableMap = mapFromPaymentMethod(result)
          promise.resolve(paymentMethodMap)
        }
      })
  }

  @ReactMethod
  fun createTokenForCVCUpdate(cvc: String, promise: Promise) {
    stripe.createCvcUpdateToken(
      cvc,
      callback = object : ApiResultCallback<Token> {
        override fun onSuccess(result: Token) {
          val tokenId = result.id
          promise.resolve(tokenId)
        }

        override fun onError(e: Exception) {
          promise.reject("Failed", e.localizedMessage)
        }
      }
    )
  }

  @ReactMethod
  fun handleCardAction(paymentIntentClientSecret: String, promise: Promise) {
    val activity = currentActivity
    if (activity != null) {
      handleCardActionPromise = promise
      stripe.handleNextActionForPayment(activity, paymentIntentClientSecret)
    }
  }

  @ReactMethod
  fun registerConfirmPaymentCallbacks(successCallback: Callback, errorCallback: Callback) {
    onConfirmPaymentError = errorCallback
    onConfirmPaymentSuccess = successCallback
  }

  @ReactMethod
  fun unregisterConfirmPaymentCallbacks() {
    onConfirmPaymentError = null
    onConfirmPaymentSuccess = null
  }

  @ReactMethod
  fun confirmPaymentMethod(paymentIntentClientSecret: String, data: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmPromise = promise
    val paymentMethodId = getValOr(data, "paymentMethodId", null)
    val confirmParams = if(paymentMethodId != null) {
      val cvc = getValOr(data, "cvc", null)
      val paymentMethodOptionParams = if (cvc != null) PaymentMethodOptionsParams.Card(cvc) else null

      ConfirmPaymentIntentParams.createWithPaymentMethodId(
        paymentMethodId = paymentMethodId,
        paymentMethodOptions = paymentMethodOptionParams,
        clientSecret = paymentIntentClientSecret
      )
    } else {
      val cardDetails = getMapOrNull(data, "cardDetails")?.let { it } ?: run {
        val message = "To confirm the payment you must provide card details or paymentMethodId"
        onConfirmSetupIntentError?.invoke(createError(ConfirmPaymentErrorType.Failed.toString(), message))
        promise.reject(ConfirmPaymentErrorType.Failed.toString(), message)
        return
      }

      var setupFutureUsage: ConfirmPaymentIntentParams.SetupFutureUsage? = null

      getValOr(data, "setupFutureUsage", null)?.let {
        setupFutureUsage = mapToPaymentIntentFutureUsage(it)
      }

      val paymentMethodCreateParams = mapToPaymentMethodCreateParams(cardDetails)
      ConfirmPaymentIntentParams
        .createWithPaymentMethodCreateParams(
          paymentMethodCreateParams = paymentMethodCreateParams,
          clientSecret = paymentIntentClientSecret,
          setupFutureUsage = setupFutureUsage
        )
    }

    val activity = currentActivity
    if (activity != null) {
      stripe.confirmPayment(activity, confirmParams)
    }
  }

  @ReactMethod
  fun retrievePaymentIntent(clientSecret: String, promise: Promise) {
    AsyncTask.execute {
      val paymentIntent = stripe.retrievePaymentIntentSynchronous(clientSecret)
      paymentIntent?.let {
        promise.resolve(mapFromPaymentIntentResult(it))
      } ?: run {
        promise.reject(RetrievePaymentIntentErrorType.Unknown.toString(), "Retrieving payment intent failed")
      }
    }
  }

  @ReactMethod
  fun registerConfirmSetupIntentCallbacks(successCallback: Callback, errorCallback: Callback) {
    onConfirmSetupIntentError = errorCallback
    onConfirmSetupIntentSuccess = successCallback
  }

  @ReactMethod
  fun unregisterConfirmSetupIntentCallbacks() {
    onConfirmSetupIntentError = null
    onConfirmSetupIntentSuccess = null
  }

  @ReactMethod
  fun confirmSetupIntent (setupIntentClientSecret: String,  data: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmSetupIntentPromise = promise
    var billing: PaymentMethod.BillingDetails? = null

    (getMapOrNull(data, "billingDetails"))?.let {
      billing = mapToBillingDetails(it)
    }

    val card = mapToCard(data.getMap("cardDetails") as ReadableMap)

    val paymentMethodParams = PaymentMethodCreateParams
      .create(card, billing, null)

    val confirmParams = ConfirmSetupIntentParams
      .create(paymentMethodParams, setupIntentClientSecret)

    val activity = currentActivity
    if (activity != null) {
      stripe.confirmSetupIntent(activity, confirmParams)
    }
  }
}
