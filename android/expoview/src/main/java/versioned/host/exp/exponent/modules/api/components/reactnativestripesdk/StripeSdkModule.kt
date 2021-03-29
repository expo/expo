package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.Intent
import android.os.AsyncTask
import com.facebook.react.bridge.*
import com.stripe.android.*
import com.stripe.android.model.*

class StripeSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "StripeSdk"
  }

  private var urlScheme: String? = null

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
              confirmSetupIntentPromise?.resolve(mapFromSetupIntentResult(setupIntent))
            }
            StripeIntent.Status.Canceled -> {
              val errorMessage = setupIntent.lastSetupError?.message.orEmpty()
              confirmSetupIntentPromise?.reject(ConfirmSetupIntentErrorType.Canceled.toString(), errorMessage)
            }
            else -> {
              val errorMessage = "unhandled error: ${setupIntent.status}"
              confirmSetupIntentPromise?.reject(ConfirmSetupIntentErrorType.Unknown.toString(), errorMessage)
            }
          }
        }

        override fun onError(e: Exception) {
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
            }
            StripeIntent.Status.RequiresPaymentMethod -> {
              val errorMessage = paymentIntent.lastPaymentError?.message.orEmpty()
              confirmPromise?.reject(ConfirmPaymentErrorType.Failed.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Failed.toString(), errorMessage)
            }
            StripeIntent.Status.RequiresConfirmation -> {
              handleCardActionPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
            }
            StripeIntent.Status.Canceled -> {
              val errorMessage = paymentIntent.lastPaymentError?.message.orEmpty()
              confirmPromise?.reject(ConfirmPaymentErrorType.Canceled.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Canceled.toString(), errorMessage)
            }
            else -> {
              val errorMessage = "unhandled error: ${paymentIntent.status}"
              confirmPromise?.reject(ConfirmPaymentErrorType.Unknown.toString(), errorMessage)
              handleCardActionPromise?.reject(NextPaymentActionErrorType.Unknown.toString(), errorMessage)
            }
          }
        }

        override fun onError(e: Exception) {
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
  fun initialise(params: ReadableMap) {
    val publishableKey = getValOr(params,"publishableKey", null) as String
    val appInfo = getMapOrNull(params,"appInfo") as ReadableMap
    val stripeAccountId = getValOr(params,"stripeAccountId", null)
    this.urlScheme = getValOr(params, "urlScheme", null)

    getMapOrNull(params,"threeDSecureParams")?.let {
      configure3dSecure(it)
    }

    val name = getValOr(appInfo, "name", "") as String
    val partnerId = getValOr(appInfo, "partnerId", "")
    val version = getValOr(appInfo, "version", "")

    val url = getValOr(appInfo, "url", "")
    Stripe.appInfo = AppInfo.create(name, version, url, partnerId)
    stripe = Stripe(reactApplicationContext, publishableKey, stripeAccountId)
    PaymentConfiguration.init(reactApplicationContext, publishableKey, stripeAccountId)
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
  fun confirmPaymentMethod(paymentIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmPromise = promise

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType")
      return
    }

    val factory = PaymentMethodCreateParamsFactory(paymentIntentClientSecret, params, urlScheme)

    try {
      val confirmParams = factory.createConfirmParams(paymentMethodType)
      stripe.confirmPayment(currentActivity!!, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), error.localizedMessage)
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
  fun confirmSetupIntent(setupIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmSetupIntentPromise = promise

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType")
      return
    }

    val factory = PaymentMethodCreateParamsFactory(setupIntentClientSecret, params, urlScheme)

    try {
      val confirmParams = factory.createSetupParams(paymentMethodType)
      stripe.confirmSetupIntent(currentActivity!!, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), error.localizedMessage)
    }
  }
}
