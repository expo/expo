package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.AsyncTask
import android.os.Parcelable
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import abi44_0_0.com.facebook.react.bridge.*
import abi44_0_0.com.facebook.react.module.annotations.ReactModule
import com.stripe.android.*
import com.stripe.android.googlepaylauncher.GooglePayLauncher
import com.stripe.android.googlepaylauncher.GooglePayPaymentMethodLauncher
import com.stripe.android.model.*
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.view.AddPaymentMethodActivityStarter
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

@ReactModule(name = StripeSdkModule.NAME)
class StripeSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  var cardFieldView: StripeSdkCardView? = null
  var cardFormView: CardFormView? = null
  private lateinit var localBroadcastManager: LocalBroadcastManager

  override fun getName(): String {
    return "StripeSdk"
  }
  private lateinit var stripe: Stripe

  private lateinit var publishableKey: String
  private var stripeAccountId: String? = null
  private var paymentSheetFragment: PaymentSheetFragment? = null

  private var urlScheme: String? = null
  private var confirmPromise: Promise? = null
  private var handleCardActionPromise: Promise? = null
  private var confirmSetupIntentPromise: Promise? = null
  private var confirmPaymentSheetPaymentPromise: Promise? = null
  private var presentPaymentSheetPromise: Promise? = null
  private var initPaymentSheetPromise: Promise? = null
  private var confirmPaymentClientSecret: String? = null

  private var googlePayFragment: GooglePayFragment? = null
  private var initGooglePayPromise: Promise? = null
  private var presentGooglePayPromise: Promise? = null

  private val mActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (::stripe.isInitialized) {
        stripe.onSetupResult(
          requestCode, data,
          object : ApiResultCallback<SetupIntentResult> {
            override fun onSuccess(result: SetupIntentResult) {
              val setupIntent = result.intent
              when (setupIntent.status) {
                StripeIntent.Status.Succeeded -> {
                  confirmSetupIntentPromise?.resolve(createResult("setupIntent", mapFromSetupIntentResult(setupIntent)))
                }
                StripeIntent.Status.Canceled -> {
                  confirmSetupIntentPromise?.resolve(createError(ConfirmSetupIntentErrorType.Canceled.toString(), setupIntent.lastSetupError))
                }
                StripeIntent.Status.RequiresAction -> {
                  confirmSetupIntentPromise?.resolve(createError(ConfirmSetupIntentErrorType.Canceled.toString(), setupIntent.lastSetupError))
                }
                else -> {
                  val errorMessage = "unhandled error: ${setupIntent.status}"
                  confirmSetupIntentPromise?.resolve(createError(ConfirmSetupIntentErrorType.Failed.toString(), errorMessage))
                }
              }
            }

            override fun onError(e: Exception) {
              confirmSetupIntentPromise?.resolve(createError(ConfirmSetupIntentErrorType.Failed.toString(), e))
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
                  val pi = createResult("paymentIntent", mapFromPaymentIntentResult(paymentIntent))
                  confirmPromise?.resolve(pi)
                  handleCardActionPromise?.resolve(pi)
                }
                StripeIntent.Status.RequiresAction -> {
                  if (isPaymentIntentNextActionVoucherBased(paymentIntent.nextActionType)) {
                    val pi = createResult("paymentIntent", mapFromPaymentIntentResult(paymentIntent))
                    confirmPromise?.resolve(pi)
                    handleCardActionPromise?.resolve(pi)
                  } else {
                    (paymentIntent.lastPaymentError)?.let {
                      confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Canceled.toString(), it))
                      handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Canceled.toString(), it))
                    } ?: run {
                      confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Canceled.toString(), "The payment has been canceled"))
                      handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Canceled.toString(), "The payment has been canceled"))
                    }
                  }
                }
                StripeIntent.Status.RequiresPaymentMethod -> {
                  val error = paymentIntent.lastPaymentError
                  confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
                  handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Failed.toString(), error))
                }
                StripeIntent.Status.RequiresConfirmation -> {
                  val pi = createResult("paymentIntent", mapFromPaymentIntentResult(paymentIntent))
                  handleCardActionPromise?.resolve(pi)
                }
                StripeIntent.Status.Canceled -> {
                  val error = paymentIntent.lastPaymentError
                  confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Canceled.toString(), error))
                  handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Canceled.toString(), error))
                }
                else -> {
                  val errorMessage = "unhandled error: ${paymentIntent.status}"
                  confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Unknown.toString(), errorMessage))
                  handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Unknown.toString(), errorMessage))
                }
              }
            }

            override fun onError(e: Exception) {
              confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), e))
              handleCardActionPromise?.resolve(createError(NextPaymentActionErrorType.Failed.toString(), e))
            }
          }
        )

        paymentSheetFragment?.activity?.activityResultRegistry?.dispatchResult(requestCode, resultCode, data)
        googlePayFragment?.activity?.activityResultRegistry?.dispatchResult(requestCode, resultCode, data)

        try {
          val result = AddPaymentMethodActivityStarter.Result.fromIntent(data)
          if (data?.getParcelableExtra<Parcelable>("extra_activity_result") != null) {
            onFpxPaymentMethodResult(result)
          }
        } catch (e: java.lang.Exception) {
          Log.d("Error", e.localizedMessage ?: e.toString())
        }
      }
    }
  }

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

  private val googlePayReceiver: BroadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent) {
      if (intent.action == ON_GOOGLE_PAY_FRAGMENT_CREATED) {
        googlePayFragment = (currentActivity as AppCompatActivity).supportFragmentManager.findFragmentByTag("google_pay_launch_fragment") as GooglePayFragment
      }
      if (intent.action == ON_INIT_GOOGLE_PAY) {
        val isReady = intent.extras?.getBoolean("isReady") ?: false

        if (isReady) {
          initGooglePayPromise?.resolve(WritableNativeMap())
        } else {
          initGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), "Google Pay is not available on this device"))
        }
      }
      if (intent.action == ON_GOOGLE_PAYMENT_METHOD_RESULT) {
        intent.extras?.getString("error")?.let {
          presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), it))
          return
        }
        when (val result = intent.extras?.getParcelable<GooglePayPaymentMethodLauncher.Result>("paymentResult")) {
          is GooglePayPaymentMethodLauncher.Result.Completed -> {
            presentGooglePayPromise?.resolve(createResult("paymentMethod", mapFromPaymentMethod(result.paymentMethod)))
          }
          GooglePayPaymentMethodLauncher.Result.Canceled -> {
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), "Google Pay has been canceled"))
          }
          is GooglePayPaymentMethodLauncher.Result.Failed -> {
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), result.error))
          }
        }
      }
      if (intent.action == ON_GOOGLE_PAY_RESULT) {
        intent.extras?.getString("error")?.let {
          presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), it))
          return
        }
        when (val result = intent.extras?.getParcelable<GooglePayLauncher.Result>("paymentResult")) {
          GooglePayLauncher.Result.Completed -> {
            presentGooglePayPromise?.resolve(WritableNativeMap())
          }
          GooglePayLauncher.Result.Canceled -> {
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), "Google Pay has been canceled"))
          }
          is GooglePayLauncher.Result.Failed -> {
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Failed.toString(), result.error))
          }
        }
      }
    }
  }

  private val mPaymentSheetReceiver: BroadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent) {
      if (intent.action == ON_FRAGMENT_CREATED) {
        paymentSheetFragment = (currentActivity as AppCompatActivity).supportFragmentManager.findFragmentByTag("payment_sheet_launch_fragment") as PaymentSheetFragment
      }
      if (intent.action == ON_PAYMENT_RESULT_ACTION) {
        when (val result = intent.extras?.getParcelable<PaymentSheetResult>("paymentResult")) {
          is PaymentSheetResult.Canceled -> {
            val message = "The payment has been canceled"
            confirmPaymentSheetPaymentPromise?.resolve(createError(PaymentSheetErrorType.Canceled.toString(), message))
            presentPaymentSheetPromise?.resolve(createError(PaymentSheetErrorType.Canceled.toString(), message))
          }
          is PaymentSheetResult.Failed -> {
            confirmPaymentSheetPaymentPromise?.resolve(createError(PaymentSheetErrorType.Failed.toString(), result.error))
            presentPaymentSheetPromise?.resolve(createError(PaymentSheetErrorType.Failed.toString(), result.error))
          }
          is PaymentSheetResult.Completed -> {
            confirmPaymentSheetPaymentPromise?.resolve(WritableNativeMap())
            presentPaymentSheetPromise?.resolve(WritableNativeMap())
          }
        }
      } else if (intent.action == ON_PAYMENT_OPTION_ACTION) {
        val label = intent.extras?.getString("label")
        val image = intent.extras?.getString("image")

        if (label != null && image != null) {
          val option: WritableMap = WritableNativeMap()
          option.putString("label", label)
          option.putString("image", image)
          presentPaymentSheetPromise?.resolve(createResult("paymentOption", option))
        } else {
          presentPaymentSheetPromise?.resolve(WritableNativeMap())
        }
        presentPaymentSheetPromise = null
      } else if (intent.action == ON_INIT_PAYMENT_SHEET) {
        initPaymentSheetPromise?.resolve(WritableNativeMap())
      } else if (intent.action == ON_CONFIGURE_FLOW_CONTROLLER) {
        val label = intent.extras?.getString("label")
        val image = intent.extras?.getString("image")

        if (label != null && image != null) {
          val option: WritableMap = WritableNativeMap()
          option.putString("label", label)
          option.putString("image", image)
          initPaymentSheetPromise?.resolve(createResult("paymentOption", option))
        } else {
          initPaymentSheetPromise?.resolve(WritableNativeMap())
        }
      }
    }
  }

  @ReactMethod
  fun initialise(params: ReadableMap, promise: Promise) {
    val publishableKey = getValOr(params, "publishableKey", null) as String
    val appInfo = getMapOrNull(params, "appInfo") as ReadableMap
    this.stripeAccountId = getValOr(params, "stripeAccountId", null)
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

    val localBroadcastManager = LocalBroadcastManager.getInstance(reactApplicationContext)
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_RESULT_ACTION))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_OPTION_ACTION))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_CONFIGURE_FLOW_CONTROLLER))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_FRAGMENT_CREATED))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_INIT_PAYMENT_SHEET))

    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAY_FRAGMENT_CREATED))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_INIT_GOOGLE_PAY))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAY_RESULT))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAYMENT_METHOD_RESULT))

    promise.resolve(null)
  }

  @ReactMethod
  fun initPaymentSheet(params: ReadableMap, promise: Promise) {
    val activity = currentActivity as AppCompatActivity?

    if (activity == null) {
      promise.resolve(createError("Failed", "Activity doesn't exist"))
      return
    }

    this.initPaymentSheetPromise = promise

    val fragment = PaymentSheetFragment().also {
      val bundle = toBundleObject(params)
      it.arguments = bundle
    }
    activity.supportFragmentManager.beginTransaction()
      .add(fragment, "payment_sheet_launch_fragment")
      .commit()
  }

  @ReactMethod
  fun presentPaymentSheet(promise: Promise) {
    this.presentPaymentSheetPromise = promise
    paymentSheetFragment?.present()
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
        confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), result.exception))
      }
      is AddPaymentMethodActivityStarter.Result.Canceled -> {
        confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Canceled.toString(), "The payment has been canceled"))
      }
    }
    this.confirmPaymentClientSecret = null
  }

  @ReactMethod
  fun createPaymentMethod(data: ReadableMap, options: ReadableMap, promise: Promise) {
    val cardParams = (cardFieldView?.cardParams ?: cardFormView?.cardParams) ?: run {
      promise.resolve(createError("Failed", "Card details not complete"))
      return
    }
    val cardAddress = cardFieldView?.cardAddress ?: cardFormView?.cardAddress

    val billingDetailsParams = mapToBillingDetails(getMapOrNull(data, "billingDetails"), cardAddress)

    val paymentMethodCreateParams = PaymentMethodCreateParams.create(cardParams, billingDetailsParams)
    stripe.createPaymentMethod(
      paymentMethodCreateParams,
      callback = object : ApiResultCallback<PaymentMethod> {
        override fun onError(error: Exception) {
          promise.resolve(createError("Failed", error))
        }

        override fun onSuccess(result: PaymentMethod) {
          val paymentMethodMap: WritableMap = mapFromPaymentMethod(result)
          promise.resolve(createResult("paymentMethod", paymentMethodMap))
        }
      }
    )
  }

  @ReactMethod
  fun createToken(params: ReadableMap, promise: Promise) {
    val type = getValOr(params, "type", null)?.let {
      if (it != "Card") {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "$it type is not supported yet"))
        return
      }
    }
    val address = getMapOrNull(params, "address")

    val cardParamsMap = (cardFieldView?.cardParams ?: cardFormView?.cardParams)?.toParamMap() ?: run {
      promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "Card details not complete"))
      return
    }

    val cardAddress = cardFieldView?.cardAddress ?: cardFormView?.cardAddress

    val cardParams = CardParams(
      number = cardParamsMap["number"] as String,
      expMonth = cardParamsMap["exp_month"] as Int,
      expYear = cardParamsMap["exp_year"] as Int,
      cvc = cardParamsMap["cvc"] as String,
      address = mapToAddress(address, cardAddress),
      name = getValOr(params, "name", null)
    )
    runBlocking {
      try {
        val token = stripe.createCardToken(
          cardParams = cardParams,
          stripeAccountId = stripeAccountId
        )
        promise.resolve(createResult("token", mapFromToken(token)))
      } catch (e: Exception) {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), e.message))
      }
    }
  }

  @ReactMethod
  fun createTokenForCVCUpdate(cvc: String, promise: Promise) {
    stripe.createCvcUpdateToken(
      cvc,
      callback = object : ApiResultCallback<Token> {
        override fun onSuccess(result: Token) {
          val tokenId = result.id
          val res = WritableNativeMap()
          res.putString("tokenId", tokenId)
          promise.resolve(res)
        }

        override fun onError(error: Exception) {
          promise.resolve(createError("Failed", error))
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

  private fun payWithWeChatPay(paymentIntentClientSecret: String, appId: String) {
    val activity = currentActivity as ComponentActivity

    activity.lifecycleScope.launch {
      stripe.createPaymentMethod(PaymentMethodCreateParams.createWeChatPay()).id?.let { paymentMethodId ->
        val confirmPaymentIntentParams =
          ConfirmPaymentIntentParams.createWithPaymentMethodId(
            paymentMethodId = paymentMethodId,
            clientSecret = paymentIntentClientSecret,
            paymentMethodOptions = PaymentMethodOptionsParams.WeChatPay(
              appId
            )
          )
        stripe.confirmPayment(activity, confirmPaymentIntentParams)
      }
    }
  }

  @ReactMethod
  fun confirmPayment(paymentIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmPromise = promise
    confirmPaymentClientSecret = paymentIntentClientSecret

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
      return
    }

    val testOfflineBank = getBooleanOrFalse(params, "testOfflineBank")

    if (paymentMethodType == PaymentMethod.Type.Fpx && !testOfflineBank) {
      payWithFpx()
      return
    }

//    if (paymentMethodType == PaymentMethod.Type.WeChatPay) {
//      val appId = getValOr(params, "appId") ?: run {
//        promise.resolve(createError("Failed", "You must provide appId"))
//        return
//      }
//      payWithWeChatPay(paymentIntentClientSecret, appId)
//
//      return
//    }

    val factory = PaymentMethodCreateParamsFactory(paymentIntentClientSecret, params, cardFieldView, cardFormView)

    try {
      val activity = currentActivity as ComponentActivity
      val confirmParams = factory.createConfirmParams(paymentMethodType)
      confirmParams.shipping = mapToShippingDetails(getMapOrNull(params, "shippingDetails"))
      stripe.confirmPayment(activity, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
  fun retrievePaymentIntent(clientSecret: String, promise: Promise) {
    AsyncTask.execute {
      val paymentIntent = stripe.retrievePaymentIntentSynchronous(clientSecret)
      paymentIntent?.let {
        promise.resolve(createResult("paymentIntent", mapFromPaymentIntentResult(it)))
      } ?: run {
        promise.resolve(createError(RetrievePaymentIntentErrorType.Unknown.toString(), "Failed to retrieve the PaymentIntent"))
      }
    }
  }

  @ReactMethod
  fun retrieveSetupIntent(clientSecret: String, promise: Promise) {
    AsyncTask.execute {
      val setupIntent = stripe.retrieveSetupIntentSynchronous(clientSecret)
      setupIntent?.let {
        promise.resolve(createResult("setupIntent", mapFromSetupIntentResult(it)))
      } ?: run {
        promise.resolve(createError(RetrieveSetupIntentErrorType.Unknown.toString(), "Failed to retrieve the SetupIntent"))
      }
    }
  }

  @ReactMethod
  fun confirmSetupIntent(setupIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    confirmSetupIntentPromise = promise

    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
      return
    }

    val factory = PaymentMethodCreateParamsFactory(setupIntentClientSecret, params, cardFieldView, cardFormView)

    try {
      val activity = currentActivity as ComponentActivity
      val confirmParams = factory.createSetupParams(paymentMethodType)
      stripe.confirmSetupIntent(activity, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
  fun initGooglePay(params: ReadableMap, promise: Promise) {
    val activity = currentActivity as AppCompatActivity
    val fragment = GooglePayFragment().also {
      val bundle = toBundleObject(params)
      it.arguments = bundle
    }

    initGooglePayPromise = promise

    activity.supportFragmentManager.beginTransaction()
      .add(fragment, "google_pay_launch_fragment")
      .commit()
  }

  @ReactMethod
  fun presentGooglePay(params: ReadableMap, promise: Promise) {
    val clientSecret = getValOr(params, "clientSecret") ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide clientSecret"))
      return
    }
    presentGooglePayPromise = promise
    if (getBooleanOrFalse(params, "forSetupIntent")) {
      val currencyCode = getValOr(params, "currencyCode") ?: run {
        promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide currencyCode"))
        return
      }
      googlePayFragment?.presentForSetupIntent(clientSecret, currencyCode)
    } else {
      googlePayFragment?.presentForPaymentIntent(clientSecret)
    }
  }

  @ReactMethod
  fun createGooglePayPaymentMethod(params: ReadableMap, promise: Promise) {
    val currencyCode = getValOr(params, "currencyCode", null) ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide currencyCode"))
      return
    }
    val amount = getIntOrNull(params, "amount") ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide amount"))
      return
    }
    presentGooglePayPromise = promise
    googlePayFragment?.createPaymentMethod(currencyCode, amount)
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

  companion object {
    const val NAME = "StripeSdk"
  }
}
