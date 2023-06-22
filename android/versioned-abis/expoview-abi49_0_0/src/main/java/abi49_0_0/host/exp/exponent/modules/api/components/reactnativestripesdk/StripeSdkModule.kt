package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.content.Intent
import android.os.Parcelable
import android.util.Log
import androidx.fragment.app.FragmentActivity
import abi49_0_0.com.facebook.react.bridge.*
import abi49_0_0.com.facebook.react.module.annotations.ReactModule
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.addresssheet.AddressLauncherFragment
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning.PushProvisioningProxy
import abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import com.stripe.android.*
import com.stripe.android.core.ApiVersion
import com.stripe.android.core.AppInfo
import com.stripe.android.googlepaylauncher.GooglePayLauncher
import com.stripe.android.model.*
import com.stripe.android.payments.bankaccount.CollectBankAccountConfiguration
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.view.AddPaymentMethodActivityStarter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch


@ReactModule(name = StripeSdkModule.NAME)
class StripeSdkModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "StripeSdk"
  }

  var cardFieldView: CardFieldView? = null
  var cardFormView: CardFormView? = null

  private lateinit var stripe: Stripe
  private lateinit var publishableKey: String
  private var stripeAccountId: String? = null
  private var urlScheme: String? = null

  private var confirmPromise: Promise? = null
  private var confirmPaymentClientSecret: String? = null
  private var createPlatformPayPaymentMethodPromise: Promise? = null
  private var platformPayUsesDeprecatedTokenFlow = false

  private var paymentSheetFragment: PaymentSheetFragment? = null
  private var googlePayFragment: GooglePayFragment? = null
  private var paymentLauncherFragment: PaymentLauncherFragment? = null
  private var collectBankAccountLauncherFragment: CollectBankAccountLauncherFragment? = null

  // If you create a new Fragment, you must put the tag here, otherwise result callbacks for that
  // Fragment will not work on RN < 0.65
  private val allStripeFragmentTags: List<String>
    get() = listOf(
      PaymentSheetFragment.TAG,
      GooglePayFragment.TAG,
      PaymentLauncherFragment.TAG,
      CollectBankAccountLauncherFragment.TAG,
      FinancialConnectionsSheetFragment.TAG,
      AddressLauncherFragment.TAG,
      GooglePayLauncherFragment.TAG
    )

  private val mActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (::stripe.isInitialized) {
        when (requestCode) {
          GooglePayRequestHelper.LOAD_PAYMENT_DATA_REQUEST_CODE -> {
            createPlatformPayPaymentMethodPromise?.let {
              GooglePayRequestHelper.handleGooglePaymentMethodResult(resultCode, data, stripe, platformPayUsesDeprecatedTokenFlow, it)
              createPlatformPayPaymentMethodPromise = null
            } ?: run { Log.d("StripeReactNative", "No promise was found, Google Pay result went unhandled,") }
          }
          else -> {
            dispatchActivityResultsToFragments(requestCode, resultCode, data)
            try {
              val result = AddPaymentMethodActivityStarter.Result.fromIntent(data)
              if (data?.getParcelableExtra<Parcelable>("extra_activity_result") != null) {
                onFpxPaymentMethodResult(result)
              }
            } catch (e: java.lang.Exception) {
              Log.d("StripeReactNative", e.localizedMessage ?: e.toString())
            }
          }
        }
      }
    }
  }

  init {
    reactContext.addActivityEventListener(mActivityEventListener)
  }

  // Necessary on older versions of React Native (~0.65 and below)
  private fun dispatchActivityResultsToFragments(requestCode: Int, resultCode: Int, data: Intent?) {
    getCurrentActivityOrResolveWithError(null)?.supportFragmentManager?.let { fragmentManager ->
      for (tag in allStripeFragmentTags) {
        fragmentManager.findFragmentByTag(tag)?.let {
          it.activity?.activityResultRegistry?.dispatchResult(requestCode, resultCode, data)
        }
      }
    }
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

  override fun getConstants(): MutableMap<String, Any> =
    hashMapOf(
      "API_VERSIONS" to hashMapOf(
        "CORE" to ApiVersion.API_VERSION_CODE,
        "ISSUING" to PushProvisioningProxy.getApiVersion(),
      )
    )

  @ReactMethod
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
    AddressLauncherFragment.publishableKey = publishableKey

    val name = getValOr(appInfo, "name", "") as String
    val partnerId = getValOr(appInfo, "partnerId", "")
    val version = getValOr(appInfo, "version", "")

    val url = getValOr(appInfo, "url", "")
    Stripe.appInfo = AppInfo.create(name, version, url, partnerId)
    stripe = Stripe(reactApplicationContext, publishableKey, stripeAccountId)

    PaymentConfiguration.init(reactApplicationContext, publishableKey, stripeAccountId)
    promise.resolve(null)
  }

  @ReactMethod
  fun initPaymentSheet(params: ReadableMap, promise: Promise) {
    getCurrentActivityOrResolveWithError(promise)?.let { activity ->
      paymentSheetFragment?.removeFragment(reactApplicationContext)
      paymentSheetFragment = PaymentSheetFragment(reactApplicationContext, promise).also {
        val bundle = toBundleObject(params)
        it.arguments = bundle
      }
      try {
        activity.supportFragmentManager.beginTransaction()
          .add(paymentSheetFragment!!, PaymentSheetFragment.TAG)
          .commit()
      } catch (error: IllegalStateException) {
        promise.resolve(createError(ErrorType.Failed.toString(), error.message))
      }
    }
  }

  @ReactMethod
  fun presentPaymentSheet(options: ReadableMap, promise: Promise) {
    if (paymentSheetFragment == null) {
      promise.resolve(PaymentSheetFragment.createMissingInitError())
      return
    }

    val timeoutKey = "timeout"
    if (options.hasKey(timeoutKey)) {
      paymentSheetFragment?.presentWithTimeout(
        options.getInt(timeoutKey).toLong(), promise
      )
    } else {
      paymentSheetFragment?.present(promise)
    }
  }

  @ReactMethod
  fun confirmPaymentSheetPayment(promise: Promise) {
    if (paymentSheetFragment == null) {
      promise.resolve(PaymentSheetFragment.createMissingInitError())
      return
    }

    paymentSheetFragment?.confirmPayment(promise)
  }

  @ReactMethod
  fun resetPaymentSheetCustomer(promise: Promise) {
    PaymentSheet.resetCustomer(context = reactApplicationContext)
    promise.resolve(null)
  }

  private fun payWithFpx() {
    getCurrentActivityOrResolveWithError(confirmPromise)?.let {
      AddPaymentMethodActivityStarter(it)
        .startForResult(AddPaymentMethodActivityStarter.Args.Builder()
                          .setPaymentMethodType(PaymentMethod.Type.Fpx)
                          .build()
        )
    }
  }

  private fun onFpxPaymentMethodResult(result: AddPaymentMethodActivityStarter.Result) {
    when (result) {
      is AddPaymentMethodActivityStarter.Result.Success -> {
        if (confirmPaymentClientSecret != null && confirmPromise != null) {
          paymentLauncherFragment = PaymentLauncherFragment.forPayment(
            context = reactApplicationContext,
            stripe,
            publishableKey,
            stripeAccountId,
            confirmPromise!!,
            confirmPaymentClientSecret!!,
            ConfirmPaymentIntentParams.createWithPaymentMethodId(
              result.paymentMethod.id!!,
              confirmPaymentClientSecret!!
            )
          )
        } else {
          Log.e("StripeReactNative", "FPX payment failed. Promise and/or client secret is not set.")
          confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "FPX payment failed. Client secret is not set."))
        }
      }
      is AddPaymentMethodActivityStarter.Result.Failure -> {
        confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), result.exception))
      }
      is AddPaymentMethodActivityStarter.Result.Canceled -> {
        confirmPromise?.resolve(createError(ConfirmPaymentErrorType.Canceled.toString(), "The payment has been canceled"))
      }
    }
    this.confirmPaymentClientSecret = null
    this.confirmPromise = null
  }

  @ReactMethod
  fun createPaymentMethod(data: ReadableMap, options: ReadableMap, promise: Promise) {
    val paymentMethodType = getValOr(data, "paymentMethodType")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
      return
    }
    val paymentMethodData = getMapOrNull(data, "paymentMethodData")
    val factory = PaymentMethodCreateParamsFactory(paymentMethodData, options, cardFieldView, cardFormView)
    try {
      val paymentMethodCreateParams = factory.createPaymentMethodParams(paymentMethodType)
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
        }
      )
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
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
      "Pii" -> {
        createTokenFromPii(params, promise)
      }
      else -> {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "$type type is not supported yet"))
      }
    }
  }

  private fun createTokenFromPii(params: ReadableMap, promise: Promise) {
    getValOr(params, "personalId", null)?.let {
      CoroutineScope(Dispatchers.IO).launch {
        runCatching {
          val token = stripe.createPiiToken(it, null, stripeAccountId)
          promise.resolve(createResult("token", mapFromToken(token)))
        }.onFailure {
          promise.resolve(createError(CreateTokenErrorType.Failed.toString(), it.message))
        }
      }
    } ?: run {
      promise.resolve(createError(CreateTokenErrorType.Failed.toString(), "personalId parameter is required"))
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
  fun handleNextAction(paymentIntentClientSecret: String, promise: Promise) {
    paymentLauncherFragment = PaymentLauncherFragment.forNextAction(
      context = reactApplicationContext,
      stripe,
      publishableKey,
      stripeAccountId,
      promise,
      paymentIntentClientSecret
    )
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
  fun confirmPayment(paymentIntentClientSecret: String, params: ReadableMap?, options: ReadableMap, promise: Promise) {
    val paymentMethodData = getMapOrNull(params, "paymentMethodData")
    val paymentMethodType = if (params != null)
      mapToPaymentMethodType(params.getString("paymentMethodType")) ?: run {
        promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
        return
      }
    else
      null // Expect that payment method was attached on the server

    val testOfflineBank = getBooleanOrFalse(params, "testOfflineBank")

    if (paymentMethodType == PaymentMethod.Type.Fpx && !testOfflineBank) {
      confirmPaymentClientSecret = paymentIntentClientSecret
      confirmPromise = promise
      payWithFpx()
      return
    }

//    if (paymentMethodType == PaymentMethod.Type.WeChatPay) {
//      val appId = getValOr(params, "appId") ?: run {
//        promise.resolve(createError("Failed", "You must provide appId"))
//        return
//      }
//      payWithWeChatPay(paymentIntentClientSecret, appId, promise)
//
//      return
//    }

    val factory = PaymentMethodCreateParamsFactory(paymentMethodData, options, cardFieldView, cardFormView)

    try {
      val confirmParams = factory.createParams(paymentIntentClientSecret, paymentMethodType, isPaymentIntent = true) as ConfirmPaymentIntentParams
      urlScheme?.let {
        confirmParams.returnUrl = mapToReturnURL(urlScheme)
      }
      confirmParams.shipping = mapToShippingDetails(getMapOrNull(paymentMethodData, "shippingDetails"))
      paymentLauncherFragment = PaymentLauncherFragment.forPayment(
        context = reactApplicationContext,
        stripe,
        publishableKey,
        stripeAccountId,
        promise,
        paymentIntentClientSecret,
        confirmParams
      )
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
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
  fun confirmSetupIntent(setupIntentClientSecret: String, params: ReadableMap, options: ReadableMap, promise: Promise) {
    val paymentMethodType = getValOr(params, "paymentMethodType")?.let { mapToPaymentMethodType(it) } ?: run {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), "You must provide paymentMethodType"))
      return
    }

    val factory = PaymentMethodCreateParamsFactory(getMapOrNull(params, "paymentMethodData"), options, cardFieldView, cardFormView)

    try {
      val confirmParams = factory.createParams(setupIntentClientSecret, paymentMethodType, isPaymentIntent = false) as ConfirmSetupIntentParams
      urlScheme?.let {
        confirmParams.returnUrl = mapToReturnURL(urlScheme)
      }
      paymentLauncherFragment = PaymentLauncherFragment.forSetup(
        context = reactApplicationContext,
        stripe,
        publishableKey,
        stripeAccountId,
        promise,
        setupIntentClientSecret,
        confirmParams
      )
    } catch (error: PaymentMethodCreateParamsException) {
      promise.resolve(createError(ConfirmPaymentErrorType.Failed.toString(), error))
    }
  }

  @ReactMethod
  fun isPlatformPaySupported(params: ReadableMap?, promise: Promise) {
    val googlePayParams = params?.getMap("googlePay")
    val fragment = GooglePayPaymentMethodLauncherFragment(
      reactApplicationContext,
      getBooleanOrFalse(googlePayParams, "testEnv"),
      getBooleanOrFalse(googlePayParams, "existingPaymentMethodRequired"),
      promise
    )

    getCurrentActivityOrResolveWithError(promise)?.let {
      try {
        it.supportFragmentManager.beginTransaction()
          .add(fragment, GooglePayPaymentMethodLauncherFragment.TAG)
          .commit()
      } catch (error: IllegalStateException) {
        promise.resolve(createError(ErrorType.Failed.toString(), error.message))
      }
    }
  }

  @ReactMethod
  fun isGooglePaySupported(params: ReadableMap?, promise: Promise) {
    val fragment = GooglePayPaymentMethodLauncherFragment(
      reactApplicationContext,
      getBooleanOrFalse(params, "testEnv"),
      getBooleanOrFalse(params, "existingPaymentMethodRequired"),
      promise
    )

    getCurrentActivityOrResolveWithError(promise)?.let {
      try {
        it.supportFragmentManager.beginTransaction()
          .add(fragment, GooglePayPaymentMethodLauncherFragment.TAG)
          .commit()
      } catch (error: IllegalStateException) {
        promise.resolve(createError(ErrorType.Failed.toString(), error.message))
      }
    }
  }

  @ReactMethod
  fun initGooglePay(params: ReadableMap, promise: Promise) {
    googlePayFragment = GooglePayFragment(promise).also {
      val bundle = toBundleObject(params)
      it.arguments = bundle
    }

    getCurrentActivityOrResolveWithError(promise)?.let {
      try {
        it.supportFragmentManager.beginTransaction()
          .add(googlePayFragment!!, GooglePayFragment.TAG)
          .commit()
      } catch (error: IllegalStateException) {
        promise.resolve(createError(ErrorType.Failed.toString(), error.message))
      }
    }
  }

  @ReactMethod
  fun presentGooglePay(params: ReadableMap, promise: Promise) {
    val clientSecret = getValOr(params, "clientSecret") ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide clientSecret"))
      return
    }

    if (getBooleanOrFalse(params, "forSetupIntent")) {
      val currencyCode = getValOr(params, "currencyCode") ?: run {
        promise.resolve(createError(GooglePayErrorType.Failed.toString(), "you must provide currencyCode"))
        return
      }
      googlePayFragment?.presentForSetupIntent(clientSecret, currencyCode, promise)
    } else {
      googlePayFragment?.presentForPaymentIntent(clientSecret, promise)
    }
  }

  @ReactMethod
  fun confirmPlatformPay(clientSecret: String, params: ReadableMap, isPaymentIntent: Boolean, promise: Promise) {
    if (!::stripe.isInitialized) {
      promise.resolve(createMissingInitError())
      return
    }

    val googlePayParams: ReadableMap = params.getMap("googlePay") ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "You must provide the `googlePay` parameter."))
      return
    }

    GooglePayLauncherFragment().also {
      it.presentGooglePaySheet(
        clientSecret,
        if (isPaymentIntent) GooglePayLauncherFragment.Mode.ForPayment else GooglePayLauncherFragment.Mode.ForSetup,
        googlePayParams,
        reactApplicationContext
      ) { launcherResult, errorMap ->
        if (errorMap != null) {
          promise.resolve(errorMap)
        } else if (launcherResult != null) {
          when (launcherResult) {
            GooglePayLauncher.Result.Completed -> {
              if (isPaymentIntent) {
                stripe.retrievePaymentIntent(clientSecret, stripeAccountId, expand = listOf("payment_method"), object : ApiResultCallback<PaymentIntent> {
                  override fun onError(e: Exception) {
                    promise.resolve(createResult("paymentIntent", WritableNativeMap()))
                  }
                  override fun onSuccess(result: PaymentIntent) {
                    promise.resolve(createResult("paymentIntent", mapFromPaymentIntentResult(result)))
                  }
                })
              } else {
                stripe.retrieveSetupIntent(clientSecret, stripeAccountId, expand = listOf("payment_method"),  object : ApiResultCallback<SetupIntent> {
                  override fun onError(e: Exception) {
                    promise.resolve(createResult("setupIntent", WritableNativeMap()))
                  }
                  override fun onSuccess(result: SetupIntent) {
                    promise.resolve(createResult("setupIntent", mapFromSetupIntentResult(result)))
                  }
                })
              }
            }
            GooglePayLauncher.Result.Canceled -> {
              promise.resolve(createError(GooglePayErrorType.Canceled.toString(), "Google Pay has been canceled"))
            }
            is GooglePayLauncher.Result.Failed -> {
              promise.resolve(createError(GooglePayErrorType.Failed.toString(), launcherResult.error))
            }
          }
        }
      }
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
    googlePayFragment?.createPaymentMethod(currencyCode, amount, promise)
  }

  @ReactMethod
  fun createPlatformPayPaymentMethod(params: ReadableMap, usesDeprecatedTokenFlow: Boolean, promise: Promise) {
    val googlePayParams: ReadableMap = params.getMap("googlePay") ?: run {
      promise.resolve(createError(GooglePayErrorType.Failed.toString(), "You must provide the `googlePay` parameter."))
      return
    }
    platformPayUsesDeprecatedTokenFlow = usesDeprecatedTokenFlow
    createPlatformPayPaymentMethodPromise = promise
    getCurrentActivityOrResolveWithError(promise)?.let {
      val request = GooglePayRequestHelper.createPaymentRequest(
        it,
        GooglePayJsonFactory(reactApplicationContext),
        googlePayParams
      )
      GooglePayRequestHelper.createPaymentMethod(request, it)
    }
  }

  @ReactMethod
  fun canAddCardToWallet(params: ReadableMap, promise: Promise) {
    val last4 = getValOr(params, "cardLastFour", null) ?: run {
      promise.resolve(createError("Failed", "You must provide cardLastFour"))
      return
    }

    if (params.getBooleanOr("supportsTapToPay", true) && !PushProvisioningProxy.isNFCEnabled(reactApplicationContext)) {
      promise.resolve(createCanAddCardResult(false, "UNSUPPORTED_DEVICE"))
      return
    }

    getCurrentActivityOrResolveWithError(promise)?.let {
      PushProvisioningProxy.isCardInWallet(it, last4) { isCardInWallet, token, error ->
        val result = error?.let {
          createCanAddCardResult(false, "MISSING_CONFIGURATION", null)
        } ?: run {
          val status = if (isCardInWallet) "CARD_ALREADY_EXISTS" else null
          createCanAddCardResult(!isCardInWallet, status, token)
        }
        promise.resolve(result)
      }
    }
  }

  @ReactMethod
  fun isCardInWallet(params: ReadableMap, promise: Promise) {
    val last4 = getValOr(params, "cardLastFour", null) ?: run {
      promise.resolve(createError("Failed", "You must provide cardLastFour"))
      return
    }
    getCurrentActivityOrResolveWithError(promise)?.let {
      PushProvisioningProxy.isCardInWallet(it, last4) { isCardInWallet, token, error ->
        val result: WritableMap = error ?: run {
          val map = WritableNativeMap()
          map.putBoolean("isInWallet", isCardInWallet)
          map.putMap("token", token)
          map
        }
        promise.resolve(result)
      }
    }
  }

  @ReactMethod
  fun collectBankAccount(isPaymentIntent: Boolean, clientSecret: String, params: ReadableMap, promise: Promise) {
    val paymentMethodData = getMapOrNull(params, "paymentMethodData")
    val paymentMethodType = mapToPaymentMethodType(getValOr(params, "paymentMethodType", null))
    if (paymentMethodType != PaymentMethod.Type.USBankAccount) {
      promise.resolve(createError(ErrorType.Failed.toString(), "collectBankAccount currently only accepts the USBankAccount payment method type."))
      return
    }

    val billingDetails = getMapOrNull(paymentMethodData, "billingDetails")

    val name = billingDetails?.getString("name")
    if (name.isNullOrEmpty()) {
      promise.resolve(createError(ErrorType.Failed.toString(), "You must provide a name when collecting US bank account details."))
      return
    }

    val collectParams = CollectBankAccountConfiguration.USBankAccount(
      name,
      billingDetails.getString("email")
    )

    collectBankAccountLauncherFragment = CollectBankAccountLauncherFragment(
      reactApplicationContext,
      publishableKey,
      stripeAccountId,
      clientSecret,
      isPaymentIntent,
      collectParams,
      promise
    )
    getCurrentActivityOrResolveWithError(promise)?.let {
      try {
        it.supportFragmentManager.beginTransaction()
          .add(collectBankAccountLauncherFragment!!, "collect_bank_account_launcher_fragment")
          .commit()
      } catch (error: IllegalStateException) {
        promise.resolve(createError(ErrorType.Failed.toString(), error.message))
      }
    }
  }

  @ReactMethod
  fun verifyMicrodeposits(isPaymentIntent: Boolean, clientSecret: String, params: ReadableMap, promise: Promise) {
    val amounts = params.getArray("amounts")
    val descriptorCode = params.getString("descriptorCode")

    if ((amounts != null && descriptorCode != null) || (amounts == null && descriptorCode == null)) {
      promise.resolve(createError(ErrorType.Failed.toString(), "You must provide either amounts OR descriptorCode, not both."))
      return
    }

    val paymentCallback = object : ApiResultCallback<PaymentIntent> {
      override fun onError(e: Exception) {
        promise.resolve(createError(ErrorType.Failed.toString(), e))
      }

      override fun onSuccess(result: PaymentIntent) {
        promise.resolve(createResult("paymentIntent", mapFromPaymentIntentResult(result)))
      }
    }

    val setupCallback = object : ApiResultCallback<SetupIntent> {
      override fun onError(e: Exception) {
        promise.resolve(createError(ErrorType.Failed.toString(), e))
      }

      override fun onSuccess(result: SetupIntent) {
        promise.resolve(createResult("setupIntent", mapFromSetupIntentResult(result)))
      }
    }

    amounts?.let {
      if (it.size() != 2) {
        promise.resolve(createError(ErrorType.Failed.toString(), "Expected 2 integers in the amounts array, but received ${it.size()}"))
        return
      }

      if (isPaymentIntent) {
        stripe.verifyPaymentIntentWithMicrodeposits(
          clientSecret,
          it.getInt(0),
          it.getInt(1),
          paymentCallback
        )
      } else {
        stripe.verifySetupIntentWithMicrodeposits(
          clientSecret,
          it.getInt(0),
          it.getInt(1),
          setupCallback
        )
      }
    } ?: descriptorCode?.let {
      if (isPaymentIntent) {
        stripe.verifyPaymentIntentWithMicrodeposits(
          clientSecret,
          it,
          paymentCallback
        )
      } else {
        stripe.verifySetupIntentWithMicrodeposits(
          clientSecret,
          it,
          setupCallback
        )
      }
    }
  }

  @ReactMethod
  fun collectBankAccountToken(clientSecret: String, promise: Promise) {
    if (!::stripe.isInitialized) {
      promise.resolve(createMissingInitError())
      return
    }
    FinancialConnectionsSheetFragment().also {
      it.presentFinancialConnectionsSheet(clientSecret, FinancialConnectionsSheetFragment.Mode.ForToken, publishableKey, stripeAccountId, promise, reactApplicationContext)
    }
  }

  @ReactMethod
  fun collectFinancialConnectionsAccounts(clientSecret: String, promise: Promise) {
    if (!::stripe.isInitialized) {
      promise.resolve(createMissingInitError())
      return
    }
    FinancialConnectionsSheetFragment().also {
      it.presentFinancialConnectionsSheet(clientSecret, FinancialConnectionsSheetFragment.Mode.ForSession, publishableKey, stripeAccountId, promise, reactApplicationContext)
    }
  }

  /**
   * We need the following in order to avoid some annoying console.warns() from our Apple Pay event listeners. Otherwise,
   * we'd have to put our users through some annoying (if Platform.OS...) logic & null-handling logic.
   */
  @ReactMethod
  fun addListener(eventName: String) {}
  @ReactMethod
  fun removeListeners(count: Int) {}

  /**
   * Safely get and cast the current activity as an AppCompatActivity. If that fails, the promise
   * provided will be resolved with an error message instructing the user to retry the method.
   */
  private fun getCurrentActivityOrResolveWithError(promise: Promise?): FragmentActivity? {
    (currentActivity as? FragmentActivity)?.let {
      return it
    }
    promise?.resolve(createMissingActivityError())
    return null
  }

  companion object {
    const val NAME = "StripeSdk"
  }
}
