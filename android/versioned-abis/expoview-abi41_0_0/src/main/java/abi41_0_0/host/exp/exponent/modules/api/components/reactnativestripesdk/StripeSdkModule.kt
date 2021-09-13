package abi41_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.AsyncTask
import android.os.Bundle
import android.os.Parcelable
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import abi41_0_0.com.facebook.react.bridge.*
import androidx.activity.ComponentActivity
import com.stripe.android.*
import com.stripe.android.model.*
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.view.AddPaymentMethodActivityStarter

class StripeSdkModule(reactContext: ReactApplicationContext, cardFieldManager: StripeSdkCardViewManager) : ReactContextBaseJavaModule(reactContext) {
  private var cardFieldManager: StripeSdkCardViewManager = cardFieldManager

  override fun getName(): String {
    return "StripeSdk"
  }

  private lateinit var publishableKey: String
  private var paymentSheetFragment: PaymentSheetFragment? = null

  private var onConfirmSetupIntentError: Callback? = null
  private var onConfirmSetupIntentSuccess: Callback? = null
  private var urlScheme: String? = null

  private var confirmPromise: Promise? = null
  private var handleCardActionPromise: Promise? = null
  private var confirmSetupIntentPromise: Promise? = null
  private var confirmPaymentSheetPaymentPromise: Promise? = null
  private var presentPaymentSheetPromise: Promise? = null
  private var initPaymentSheetPromise: Promise? = null

  private var confirmPaymentClientSecret: String? = null

  private val mActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (!this@StripeSdkModule::stripe.isInitialized) {
        return
      }

      stripe.onSetupResult(
        requestCode, data,
        object : ApiResultCallback<SetupIntentResult> {
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
        }
      )

      stripe.onPaymentResult(
        requestCode, data,
        object : ApiResultCallback<PaymentIntentResult> {
          override fun onSuccess(result: PaymentIntentResult) {
            val paymentIntent = result.intent

            when (paymentIntent.status) {
              StripeIntent.Status.Succeeded,
              StripeIntent.Status.Processing,
              StripeIntent.Status.RequiresCapture -> {
                confirmPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
                handleCardActionPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
              }
              StripeIntent.Status.RequiresAction -> {
                if (isPaymentIntentNextActionVoucherBased(paymentIntent.nextActionType)) {
                  confirmPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
                  handleCardActionPromise?.resolve(mapFromPaymentIntentResult(paymentIntent))
                } else {
                  val errorMessage = paymentIntent.lastPaymentError?.message.orEmpty()
                  confirmPromise?.reject(ConfirmPaymentErrorType.Canceled.toString(), errorMessage)
                  handleCardActionPromise?.reject(NextPaymentActionErrorType.Canceled.toString(), errorMessage)
                }
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
        }
      )

      paymentSheetFragment?.activity?.activityResultRegistry?.dispatchResult(requestCode, resultCode, data)

      try {
        val result = AddPaymentMethodActivityStarter.Result.fromIntent(data)
        if (data?.getParcelableExtra<Parcelable>("extra_activity_result") != null) {
          onFpxPaymentMethodResult(result)
        }
      } catch (e: java.lang.Exception) {
        Log.d("Error", e.localizedMessage)
      }
    }
  }

  private lateinit var stripe: Stripe

  init {
    reactContext.addActivityEventListener(mActivityEventListener)
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

  private val mPaymentSheetReceiver: BroadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent) {
      if (intent.action == ON_FRAGMENT_CREATED) {
        paymentSheetFragment = (currentActivity as AppCompatActivity).supportFragmentManager.findFragmentByTag("payment_sheet_launch_fragment") as PaymentSheetFragment
      }
      if (intent.action == ON_PAYMENT_RESULT_ACTION) {
        when (intent.extras?.getParcelable<PaymentSheetResult>("paymentResult")) {
          is PaymentSheetResult.Canceled -> {
            confirmPaymentSheetPaymentPromise?.reject(PaymentSheetErrorType.Canceled.toString(), "")
            presentPaymentSheetPromise?.reject(PaymentSheetErrorType.Canceled.toString(), "")
          }
          is PaymentSheetResult.Failed -> {
            confirmPaymentSheetPaymentPromise?.reject(PaymentSheetErrorType.Failed.toString(), "")
            presentPaymentSheetPromise?.reject(PaymentSheetErrorType.Failed.toString(), "")
          }
          is PaymentSheetResult.Completed -> {
            confirmPaymentSheetPaymentPromise?.resolve(Arguments.createMap())
            presentPaymentSheetPromise?.resolve(Arguments.createMap())
          }
        }
      } else if (intent.action == ON_PAYMENT_OPTION_ACTION) {
        val label = intent.extras?.getString("label")
        val image = intent.extras?.getString("image")

        if (label != null && image != null) {
          val option: WritableMap = WritableNativeMap()
          val result: WritableMap = WritableNativeMap()
          option.putString("label", label)
          option.putString("image", image)
          result.putMap("paymentOption", option)
          presentPaymentSheetPromise?.resolve(result)
        } else {
          presentPaymentSheetPromise?.resolve(Arguments.createMap())
        }
      } else if (intent.action == ON_CONFIGURE_FLOW_CONTROLLER) {
        val label = intent.extras?.getString("label")
        val image = intent.extras?.getString("image")

        if (label != null && image != null) {
          val option: WritableMap = WritableNativeMap()
          option.putString("label", label)
          option.putString("image", image)
          initPaymentSheetPromise?.resolve(option)
        } else {
          initPaymentSheetPromise?.resolve(null)
        }
      }
    }
  }

  // / Check paymentIntent.nextAction is voucher-based payment method.
  // / If it's voucher-based, the paymentIntent status stays in requiresAction until the voucher is paid or expired.
  // / Currently only OXXO payment is voucher-based.
  private fun isPaymentIntentNextActionVoucherBased(nextAction: StripeIntent.NextActionType?): Boolean {
    nextAction?.let {
      return it == StripeIntent.NextActionType.DisplayOxxoDetails
    }
    return false
  }

  @ReactMethod
  fun initialise(params: ReadableMap, promise: Promise) {
    val publishableKey = getValOr(params, "publishableKey", null) as String
    val appInfo = getMapOrNull(params, "appInfo") as ReadableMap
    val stripeAccountId = getValOr(params, "stripeAccountId", null)
    val urlScheme = getValOr(params, "urlScheme", null)
    val setUrlSchemeOnAndroid = getBooleanOrFalse(params, "setUrlSchemeOnAndroid")
    this.urlScheme = if (setUrlSchemeOnAndroid) urlScheme else null

    getMapOrNull(params, "threeDSecureParams")?.let {
      configure3dSecure(it)
    }

    this.publishableKey = publishableKey

    val name = getValOr(appInfo, "name", "") as String
    val partnerId = getValOr(appInfo, "partnerId", "")
    val version = getValOr(appInfo, "version", "")

    val url = getValOr(appInfo, "url", "")
    Stripe.appInfo = AppInfo.create(name, version, url, partnerId)
    stripe = Stripe(reactApplicationContext, publishableKey, stripeAccountId)

    PaymentConfiguration.init(reactApplicationContext, publishableKey, stripeAccountId)

    this.currentActivity?.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_RESULT_ACTION))
    this.currentActivity?.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_OPTION_ACTION))
    this.currentActivity?.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_CONFIGURE_FLOW_CONTROLLER))
    this.currentActivity?.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_FRAGMENT_CREATED))

    promise.resolve(null)
  }

  @ReactMethod
  fun initPaymentSheet(params: ReadableMap, promise: Promise) {
    val activity = currentActivity as AppCompatActivity

    if (activity == null) {
      promise.reject("Fail", "Activity doesn't exist")
      return
    }
    val customFlow = getBooleanOrNull(params, "customFlow") ?: false

    PaymentConfiguration.init(reactApplicationContext, publishableKey)

    val customerId = getValOr(params, "customerId")
    val customerEphemeralKeySecret = getValOr(params, "customerEphemeralKeySecret")
    val paymentIntentClientSecret = getValOr(params, "paymentIntentClientSecret")
    val merchantDisplayName = getValOr(params, "merchantDisplayName")
    val countryCode = getValOr(params, "merchantCountryCode")
    val testEnv = getBooleanOrNull(params, "testEnv") ?: false

    this.initPaymentSheetPromise = promise

    val fragment = PaymentSheetFragment().also {
      val bundle = Bundle()
      bundle.putString("customerId", customerId)
      bundle.putString("customerEphemeralKeySecret", customerEphemeralKeySecret)
      bundle.putString("paymentIntentClientSecret", paymentIntentClientSecret)
      bundle.putString("merchantDisplayName", merchantDisplayName)
      bundle.putString("countryCode", countryCode)
      bundle.putBoolean("customFlow", customFlow)
      bundle.putBoolean("testEnv", testEnv)

      it.arguments = bundle
    }
    activity.supportFragmentManager.beginTransaction()
      .add(fragment, "payment_sheet_launch_fragment")
      .commit()
    if (!customFlow) {
      this.initPaymentSheetPromise?.resolve(null)
    }
  }

  @ReactMethod
  fun presentPaymentSheet(params: ReadableMap, promise: Promise) {
    val clientSecret = getValOr(params, "clientSecret") as String
    val confirmPayment = getBooleanOrNull(params, "confirmPayment")
    this.presentPaymentSheetPromise = promise
    if (confirmPayment == false) {
      paymentSheetFragment?.presentPaymentOptions()
    } else {
      paymentSheetFragment?.present(clientSecret)
    }
  }

  @ReactMethod
  fun confirmPaymentSheetPayment(promise: Promise) {
    this.confirmPaymentSheetPaymentPromise = promise
    paymentSheetFragment?.confirmPayment()
  }

  private fun payWithFpx() {
    AddPaymentMethodActivityStarter(currentActivity as AppCompatActivity)
      .startForResult(
        AddPaymentMethodActivityStarter.Args.Builder()
          .setPaymentMethodType(PaymentMethod.Type.Fpx)
          .build()
      )
  }

  private fun onFpxPaymentMethodResult(result: AddPaymentMethodActivityStarter.Result) {
    when (result) {
      is AddPaymentMethodActivityStarter.Result.Success -> {
        val activity = currentActivity as ComponentActivity

        stripe.confirmPayment(
          activity,
          ConfirmPaymentIntentParams.createWithPaymentMethodId(
            result.paymentMethod.id!!,
            confirmPaymentClientSecret!!,
          )
        )
      }
      is AddPaymentMethodActivityStarter.Result.Failure -> {
        confirmPromise?.reject(ConfirmPaymentErrorType.Failed.toString(), result.exception.localizedMessage)
      }
      is AddPaymentMethodActivityStarter.Result.Canceled -> {
        confirmPromise?.reject(ConfirmPaymentErrorType.Canceled.toString(), "Fpx payment has been canceled")
      }
    }
    this.confirmPaymentClientSecret = null
  }

  @ReactMethod
  fun createPaymentMethod(data: ReadableMap, options: ReadableMap, promise: Promise) {
    val billingDetailsParams = mapToBillingDetails(getMapOrNull(data, "billingDetails"))
    val instance = cardFieldManager.getCardViewInstance()
    val cardParams = instance?.cardParams
      ?: throw PaymentMethodCreateParamsException("Card details not complete")
    val paymentMethodCreateParams = PaymentMethodCreateParams.create(cardParams, billingDetailsParams)
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
      }
    )
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
    val activity = currentActivity as ComponentActivity
    if (activity != null) {
      handleCardActionPromise = promise
      stripe.handleNextActionForPayment(activity, paymentIntentClientSecret)
    }
  }

  @ReactMethod
  fun confirmPaymentMethod(paymentIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmPromise = promise
    confirmPaymentClientSecret = paymentIntentClientSecret

    val instance = cardFieldManager.getCardViewInstance()
    val cardParams = instance?.cardParams

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType")
      return
    }

    val testOfflineBank = getBooleanOrFalse(params, "testOfflineBank")

    if (paymentMethodType == PaymentMethod.Type.Fpx && !testOfflineBank) {
      payWithFpx()
      return
    }

    val factory = PaymentMethodCreateParamsFactory(paymentIntentClientSecret, params, urlScheme, cardParams)

    try {
      val activity = currentActivity as ComponentActivity
      val confirmParams = factory.createConfirmParams(paymentMethodType)
      confirmParams.shipping = mapToShippingDetails(getMapOrNull(params, "shippingDetails"))
      stripe.confirmPayment(activity, confirmParams)
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
  fun confirmSetupIntent(setupIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmSetupIntentPromise = promise

    val instance = cardFieldManager.getCardViewInstance()
    val cardParams = instance?.cardParams

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType")
      return
    }

    val factory = PaymentMethodCreateParamsFactory(setupIntentClientSecret, params, urlScheme, cardParams)

    try {
      val activity = currentActivity as ComponentActivity
      val confirmParams = factory.createSetupParams(paymentMethodType)
      stripe.confirmSetupIntent(activity, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.reject(ConfirmPaymentErrorType.Failed.toString(), error.localizedMessage)
    }
  }
}
