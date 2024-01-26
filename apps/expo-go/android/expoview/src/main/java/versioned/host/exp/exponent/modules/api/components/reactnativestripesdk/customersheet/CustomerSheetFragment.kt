package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.app.Application
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import com.facebook.react.bridge.*
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.customersheet.ReactNativeCustomerAdapter
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import com.stripe.android.customersheet.CustomerAdapter
import com.stripe.android.customersheet.CustomerEphemeralKey
import com.stripe.android.customersheet.CustomerSheet
import com.stripe.android.customersheet.CustomerSheetResult
import com.stripe.android.customersheet.ExperimentalCustomerSheetApi
import com.stripe.android.customersheet.PaymentOptionSelection
import com.stripe.android.model.PaymentMethod
import com.stripe.android.paymentsheet.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch


@OptIn(ExperimentalCustomerSheetApi::class)
class CustomerSheetFragment : Fragment() {
  private var customerSheet: CustomerSheet? = null
  internal var customerAdapter: ReactNativeCustomerAdapter? = null
  internal var context: ReactApplicationContext? = null
  internal var initPromise: Promise? = null
  private var presentPromise: Promise? = null

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

    val context = context ?: run {
      Log.e("StripeReactNative", "No context found during CustomerSheet.initialize. Please file an issue: https://github.com/stripe/stripe-react-native/issues")
      return
    }
    val initPromise = initPromise ?: run {
      Log.e("StripeReactNative", "No promise found for CustomerSheet.initialize. Please file an issue: https://github.com/stripe/stripe-react-native/issues")
      return
    }

    val headerTextForSelectionScreen = arguments?.getString("headerTextForSelectionScreen")
    val merchantDisplayName = arguments?.getString("merchantDisplayName")
    val googlePayEnabled = arguments?.getBoolean("googlePayEnabled") ?: false
    val billingDetailsBundle = arguments?.getBundle("defaultBillingDetails")
    val billingConfigParams = arguments?.getBundle("billingDetailsCollectionConfiguration")
    val setupIntentClientSecret = arguments?.getString("setupIntentClientSecret")
    val customerId = arguments?.getString("customerId")
    val customerEphemeralKeySecret = arguments?.getString("customerEphemeralKeySecret")
    val customerAdapterOverrideParams = arguments?.getBundle("customerAdapter")

    if (customerId == null) {
      initPromise.resolve(createError(ErrorType.Failed.toString(), "You must provide a value for `customerId`"))
      return
    }
    if (customerEphemeralKeySecret == null) {
      initPromise.resolve(createError(ErrorType.Failed.toString(), "You must provide a value for `customerEphemeralKeySecret`"))
      return
    }

    val appearance = try {
      buildPaymentSheetAppearance(arguments?.getBundle("appearance"), context)
    } catch (error: PaymentSheetAppearanceException) {
      initPromise.resolve(createError(ErrorType.Failed.toString(), error))
      return
    }

    val configuration = CustomerSheet.Configuration.builder()
      .appearance(appearance)
      .googlePayEnabled(googlePayEnabled)
      .merchantDisplayName(merchantDisplayName)
      .headerTextForSelectionScreen(headerTextForSelectionScreen)

    billingDetailsBundle?.let {
      configuration.defaultBillingDetails(createDefaultBillingDetails(billingDetailsBundle))
    }
    billingConfigParams?.let {
      configuration.billingDetailsCollectionConfiguration(createBillingDetailsCollectionConfiguration(billingConfigParams))
    }

    val customerAdapter = createCustomerAdapter(
      context, customerId, customerEphemeralKeySecret, setupIntentClientSecret, customerAdapterOverrideParams
    ).also {
      this.customerAdapter = it
    }

    customerSheet = CustomerSheet.create(
      fragment = this,
      configuration = configuration.build(),
      customerAdapter = customerAdapter,
      callback = ::handleResult
    )

    initPromise.resolve(WritableNativeMap())
  }

  private fun handleResult(result: CustomerSheetResult) {
    val presentPromise = presentPromise ?: run {
      Log.e("StripeReactNative", "No promise found for CustomerSheet.present")
      return
    }

    var promiseResult = Arguments.createMap()
    when (result) {
      is CustomerSheetResult.Failed -> {
        presentPromise.resolve(createError(ErrorType.Failed.toString(), result.exception))
      }
      is CustomerSheetResult.Selected -> {
        promiseResult = createPaymentOptionResult(result.selection)
      }
      is CustomerSheetResult.Canceled -> {
        promiseResult = createPaymentOptionResult(result.selection)
        promiseResult.putMap("error", Arguments.createMap().also { it.putString("code", ErrorType.Canceled.toString()) })
      }
    }
    presentPromise.resolve(promiseResult)
  }

  fun present(timeout: Long?, promise: Promise) {
    presentPromise = promise
    if (timeout != null) {
      presentWithTimeout(timeout, promise)
    }
    customerSheet?.present() ?: run {
      promise.resolve(createMissingInitError())
    }
  }

  private fun presentWithTimeout(timeout: Long, promise: Promise) {
    var customerSheetActivity: Activity? = null
    var activities: MutableList<Activity> = mutableListOf()
    val activityLifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        customerSheetActivity = activity
        activities.add(activity)
      }

      override fun onActivityStarted(activity: Activity) {}

      override fun onActivityResumed(activity: Activity) {}

      override fun onActivityPaused(activity: Activity) {}

      override fun onActivityStopped(activity: Activity) {}

      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

      override fun onActivityDestroyed(activity: Activity) {
        customerSheetActivity = null
        activities = mutableListOf()
        context?.currentActivity?.application?.unregisterActivityLifecycleCallbacks(this)
      }
    }

      Handler(Looper.getMainLooper()).postDelayed({
        //customerSheetActivity?.finish()
        for (a in activities) {
          a.finish()
        }
      }, timeout)


    context?.currentActivity?.application?.registerActivityLifecycleCallbacks(activityLifecycleCallbacks)

    customerSheet?.present() ?: run {
      promise.resolve(createMissingInitError())
    }
  }

  internal fun retrievePaymentOptionSelection(promise: Promise) {
    CoroutineScope(Dispatchers.IO).launch {
      runCatching {
        val result = customerSheet?.retrievePaymentOptionSelection() ?: run {
          promise.resolve(createMissingInitError())
          return@launch
        }
        var promiseResult = Arguments.createMap()
        when (result) {
          is CustomerSheetResult.Failed -> {
            promise.resolve(createError(ErrorType.Failed.toString(), result.exception))
          }
          is CustomerSheetResult.Selected -> {
            promiseResult = createPaymentOptionResult(result.selection)
          }
          is CustomerSheetResult.Canceled -> {
            promiseResult = createPaymentOptionResult(result.selection)
            promiseResult.putMap("error", Arguments.createMap().also { it.putString("code", ErrorType.Canceled.toString()) })
          }
        }
        promise.resolve(promiseResult)
      }.onFailure {
        promise.resolve(createError(CreateTokenErrorType.Failed.toString(), it.message))
      }
    }
  }

  companion object {
    internal const val TAG = "customer_sheet_launch_fragment"

    internal fun createMissingInitError(): WritableMap {
      return createError(ErrorType.Failed.toString(), "No customer sheet has been initialized yet.")
    }

    internal fun createDefaultBillingDetails(bundle: Bundle): PaymentSheet.BillingDetails {
      val addressBundle = bundle.getBundle("address")
      val address = PaymentSheet.Address(
        addressBundle?.getString("city"),
        addressBundle?.getString("country"),
        addressBundle?.getString("line1"),
        addressBundle?.getString("line2"),
        addressBundle?.getString("postalCode"),
        addressBundle?.getString("state"))
      return PaymentSheet.BillingDetails(
        address,
        bundle.getString("email"),
        bundle.getString("name"),
        bundle.getString("phone"))
    }

    internal fun createBillingDetailsCollectionConfiguration(bundle: Bundle): PaymentSheet.BillingDetailsCollectionConfiguration {
      return PaymentSheet.BillingDetailsCollectionConfiguration(
        name = mapToCollectionMode(bundle.getString("name")),
        phone = mapToCollectionMode(bundle.getString("phone")),
        email = mapToCollectionMode(bundle.getString("email")),
        address = mapToAddressCollectionMode(bundle.getString("address")),
        attachDefaultsToPaymentMethod = bundle.getBoolean("attachDefaultsToPaymentMethod")
      )
    }

    internal fun createCustomerAdapter(
      context: ReactApplicationContext,
      customerId: String,
      customerEphemeralKeySecret: String,
      setupIntentClientSecret: String?,
      customerAdapterOverrideParams: Bundle?,
    ): ReactNativeCustomerAdapter {
      val ephemeralKeyProvider = {
        CustomerAdapter.Result.success(
          CustomerEphemeralKey.create(
            customerId = customerId,
            ephemeralKey = customerEphemeralKeySecret,
          )
        )
      }
      val customerAdapter = if (setupIntentClientSecret != null) {
        CustomerAdapter.create(
          context,
          customerEphemeralKeyProvider = ephemeralKeyProvider,
          setupIntentClientSecretProvider = {
            CustomerAdapter.Result.success(
              setupIntentClientSecret,
            )
          }
        )
      } else {
        CustomerAdapter.create(
          context,
          customerEphemeralKeyProvider = ephemeralKeyProvider,
          setupIntentClientSecretProvider = null
        )
      }

      return ReactNativeCustomerAdapter(
        context = context,
        adapter = customerAdapter,
        overridesFetchPaymentMethods = customerAdapterOverrideParams?.getBoolean("fetchPaymentMethods") ?: false,
        overridesAttachPaymentMethod = customerAdapterOverrideParams?.getBoolean("attachPaymentMethod") ?: false,
        overridesDetachPaymentMethod = customerAdapterOverrideParams?.getBoolean("detachPaymentMethod") ?: false,
        overridesSetSelectedPaymentOption = customerAdapterOverrideParams?.getBoolean("setSelectedPaymentOption") ?: false,
        overridesFetchSelectedPaymentOption = customerAdapterOverrideParams?.getBoolean("fetchSelectedPaymentOption") ?: false,
        overridesSetupIntentClientSecretForCustomerAttach = customerAdapterOverrideParams?.getBoolean("setupIntentClientSecretForCustomerAttach") ?: false
      )
    }

    internal fun createPaymentOptionResult(selection: PaymentOptionSelection?): WritableMap {
      var paymentOptionResult = Arguments.createMap()

      when (selection) {
        is PaymentOptionSelection.GooglePay -> {
          paymentOptionResult = buildResult(
            selection.paymentOption.label,
            selection.paymentOption.icon(),
            null)
        }
        is PaymentOptionSelection.PaymentMethod -> {
          paymentOptionResult = buildResult(
            selection.paymentOption.label,
            selection.paymentOption.icon(),
            selection.paymentMethod)
        }
        null -> {}
      }

      return paymentOptionResult
    }

    private fun buildResult(label: String, drawable: Drawable, paymentMethod: PaymentMethod?): WritableMap {
      val result = Arguments.createMap()
      val paymentOption = Arguments.createMap().also {
        it.putString("label", label)
        it.putString("image", getBase64FromBitmap(getBitmapFromDrawable(drawable)))
      }
      result.putMap("paymentOption", paymentOption)
      if (paymentMethod != null) {
        result.putMap("paymentMethod", mapFromPaymentMethod(paymentMethod))
      }
      return result
    }
  }
}
