package abi45_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Parcelable
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.appcompat.app.AppCompatActivity
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import abi45_0_0.com.facebook.react.bridge.*
import abi45_0_0.com.facebook.react.module.annotations.ReactModule
import com.stripe.android.*
import com.stripe.android.googlepaylauncher.GooglePayLauncher
import com.stripe.android.googlepaylauncher.GooglePayPaymentMethodLauncher
import com.stripe.android.model.*
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.view.AddPaymentMethodActivityStarter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@ReactModule(name = StripeSdkModule.NAME)
class StripeSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  var cardFieldView: CardFieldView? = null
  var cardFormView: CardFormView? = null

  override fun getName(): String {
    return "StripeSdk"
  }
  private lateinit var stripe: Stripe

  private lateinit var paymentLauncherFragment: PaymentLauncherFragment

  private lateinit var publishableKey: String
  private var stripeAccountId: String? = null
  private var paymentSheetFragment: PaymentSheetFragment? = null

  private var urlScheme: String? = null
  private var confirmPromise: Promise? = null
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
        stripe.onSetupResult(requestCode, data, object : ApiResultCallback<SetupIntentResult> {
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
        })

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
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Canceled.toString(), "Google Pay has been canceled"))
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
            presentGooglePayPromise?.resolve(createError(GooglePayErrorType.Canceled.toString(), "Google Pay has been canceled"))
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
      }
      else if (intent.action == ON_INIT_PAYMENT_SHEET) {
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
  @SuppressWarnings("unused")
  fun initialise(params: ReadableMap, promise: Promise) {
    val publishableKey = getValOr(params, "publishableKey", null) as String
    val appInfo = getMapOrNull(params, "appInfo") as ReadableMap
    this.stripeAccountId = getValOr(params, "stripeAccountId", null)
    val urlScheme = getValOr(params, "urlScheme", null)
    val setReturnUrlSchemeOnAndroid = getBooleanOrFalse(params, "setReturnUrlSchemeOnAndroid")
    this.urlScheme = if (setReturnUrlSchemeOnAndroid) urlScheme else null

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

    paymentLauncherFragment = PaymentLauncherFragment(stripe, publishableKey, stripeAccountId)
    (currentActivity as AppCompatActivity).supportFragmentManager.beginTransaction()
      .add(paymentLauncherFragment, "payment_launcher_fragment")
      .commit()

    val localBroadcastManager = LocalBroadcastManager.getInstance(reactApplicationContext)
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_RESULT_ACTION))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_PAYMENT_OPTION_ACTION))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_CONFIGURE_FLOW_CONTROLLER))
    localBroadcastManager.registerReceiver(mPaymentSheetReceiver, IntentFilter(ON_INIT_PAYMENT_SHEET))

    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAY_FRAGMENT_CREATED))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_INIT_GOOGLE_PAY))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAY_RESULT))
    localBroadcastManager.registerReceiver(googlePayReceiver, IntentFilter(ON_GOOGLE_PAYMENT_METHOD_RESULT))

    promise.resolve(null)
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun initPaymentSheet(params: ReadableMap, promise: Promise) {
    val activity = currentActivity as AppCompatActivity?

    if (activity == null) {
      promise.resolve(createError("Failed", "Activity doesn't exist"))
      return
    }

    this.initPaymentSheetPromise = promise

    paymentSheetFragment = PaymentSheetFragment().also {
      val bundle = toBundleObject(params)
      it.arguments = bundle
    }
    activity.supportFragmentManager.beginTransaction()
      .add(paymentSheetFragment!!, "payment_sheet_launch_fragment")
      .commit()
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun presentPaymentSheet(promise: Promise) {
    this.presentPaymentSheetPromise = promise
    paymentSheetFragment?.present()
  }

  @ReactMethod
  @SuppressWarnings("unused")
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
        paymentLauncherFragment.paymentLauncher.confirm(
          ConfirmPaymentIntentParams.createWithPaymentMethodId(
            result.paymentMethod.id!!,
            confirmPaymentClientSecret!!
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
  @SuppressWarnings("unused")
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
        override fun onError(e: Exception) {
          promise.resolve(createError("Failed", e))
        }

        override fun onSuccess(result: PaymentMethod) {
          val paymentMethodMap: WritableMap = mapFromPaymentMethod(result)
          promise.resolve(createResult("paymentMethod", paymentMethodMap))
        }
      })
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun createToken(params: ReadableMap, promise: Promise) {
    val type = getValOr(params, "type", null)
    if (type == null) {
      promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "type parameter is required"))
      return
    }

    when (type) {
      "BankAccount" -> {
        createTokenFromBankAccount(params, promise)
      }
      "Card" -> {
        createTokenFromCard(params, promise)
      }
      else -> {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "$type type is not supported yet"))
      }
    }
  }

  private fun createTokenFromBankAccount(params: ReadableMap, promise: Promise) {
    val accountHolderName = getValOr(params, "accountHolderName", null)
    val accountHolderType = getValOr(params, "accountHolderType", null)
    val accountNumber = getValOr(params, "accountNumber", null)
    val country = getValOr(params, "country", null)
    val currency = getValOr(params, "currency", null)
    val routingNumber = getValOr(params, "routingNumber", null)

    val bankAccountParams = BankAccountTokenParams(
      country = country!!,
      currency = currency!!,
      accountNumber = accountNumber!!,
      accountHolderName = accountHolderName,
      routingNumber = routingNumber,
      accountHolderType = mapToBankAccountType(accountHolderType)
    )
    CoroutineScope(Dispatchers.IO).launch {
      runCatching {
        val token = stripe.createBankAccountToken(bankAccountParams, null, stripeAccountId)
        promise.resolve(createResult("token", mapFromToken(token)))
      }.onFailure {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), it.message))
      }
    }

  }

  private fun createTokenFromCard(params: ReadableMap, promise: Promise) {
    val cardParamsMap = (cardFieldView?.cardParams ?: cardFormView?.cardParams)?.toParamMap()
      ?: run {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "Card details not complete"))
        return
      }

    val cardAddress = cardFieldView?.cardAddress ?: cardFormView?.cardAddress
    val address = getMapOrNull(params, "address")
    val cardParams = CardParams(
      number = cardParamsMap["number"] as String,
      expMonth = cardParamsMap["exp_month"] as Int,
      expYear = cardParamsMap["exp_year"] as Int,
      cvc = cardParamsMap["cvc"] as String,
      address = mapToAddress(address, cardAddress),
      name = getValOr(params, "name", null),
      currency = getValOr(params, "currency", null),
    )

    CoroutineScope(Dispatchers.IO).launch {
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
  @SuppressWarnings("unused")
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

        override fun onError(e: Exception) {
          promise.resolve(createError("Failed", e))
        }
      }
    )
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun handleNextAction(paymentIntentClientSecret: String, promise: Promise) {
    paymentLauncherFragment.clientSecret = paymentIntentClientSecret
    paymentLauncherFragment.promise = promise
    paymentLauncherFragment.paymentLauncher.handleNextActionForPaymentIntent(paymentIntentClientSecret)
  }

// TODO: Uncomment when WeChat is re-enabled in stripe-ios
//  private fun payWithWeChatPay(paymentIntentClientSecret: String, appId: String) {
//    val activity = currentActivity as ComponentActivity
//
//    activity.lifecycleScope.launch {
//      stripe.createPaymentMethod(PaymentMethodCreateParams.createWeChatPay()).id?.let { paymentMethodId ->
//        val confirmPaymentIntentParams =
//          ConfirmPaymentIntentParams.createWithPaymentMethodId(
//            paymentMethodId = paymentMethodId,
//            clientSecret = paymentIntentClientSecret,
//            paymentMethodOptions = PaymentMethodOptionsParams.WeChatPay(
//              appId
//            )
//          )
//        paymentLauncherFragment.paymentLauncher.confirm(confirmPaymentIntentParams)
//      }
//    }
//  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun confirmPayment(paymentIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    val paymentMethodType = getValOr(params, "type")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
      return
    }

    paymentLauncherFragment.clientSecret = paymentIntentClientSecret
    paymentLauncherFragment.promise = promise

    val testOfflineBank = getBooleanOrFalse(params, "testOfflineBank")

    if (paymentMethodType == PaymentMethod.Type.Fpx && !testOfflineBank) {
      confirmPaymentClientSecret = paymentIntentClientSecret
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
      val confirmParams = factory.createConfirmParams(paymentMethodType)
      urlScheme?.let {
        confirmParams.returnUrl = mapToReturnURL(urlScheme)
      }
      confirmParams.shipping = mapToShippingDetails(getMapOrNull(params, "shippingDetails"))
      paymentLauncherFragment.paymentLauncher.confirm(confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun retrievePaymentIntent(clientSecret: String, promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      val paymentIntent = stripe.retrievePaymentIntentSynchronous(clientSecret)
      paymentIntent?.let {
        promise.resolve(createResult("paymentIntent", mapFromPaymentIntentResult(it)))
      } ?: run {
        promise.resolve(createError(RetrievePaymentIntentErrorType.Unknown.toString(), "Failed to retrieve the PaymentIntent"))
      }
    }
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun retrieveSetupIntent(clientSecret: String, promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      val setupIntent = stripe.retrieveSetupIntentSynchronous(clientSecret)
      setupIntent?.let {
        promise.resolve(createResult("setupIntent", mapFromSetupIntentResult(it)))
      } ?: run {
        promise.resolve(createError(RetrieveSetupIntentErrorType.Unknown.toString(), "Failed to retrieve the SetupIntent"))
      }
    }
  }

  @ReactMethod
  @SuppressWarnings("unused")
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
      urlScheme?.let {
        confirmParams.returnUrl = mapToReturnURL(urlScheme)
      }
      stripe.confirmSetupIntent(activity, confirmParams)
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
  @SuppressWarnings("unused")
  fun isGooglePaySupported(params: ReadableMap?, promise: Promise) {
    val fragment = GooglePayPaymentMethodLauncherFragment(
      currentActivity as AppCompatActivity,
      getBooleanOrFalse(params, "testEnv"),
      getBooleanOrFalse(params, "existingPaymentMethodRequired"),
      promise
    )

    (currentActivity as AppCompatActivity).supportFragmentManager.beginTransaction()
      .add(fragment, "google_pay_support_fragment")
      .commit()
  }

  @ReactMethod
  @SuppressWarnings("unused")
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
  @SuppressWarnings("unused")
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
  @SuppressWarnings("unused")
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

  companion object {
    const val NAME = "StripeSdk"
  }
}
