package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.customersheet

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.StripeSdkModule
import com.stripe.android.customersheet.CustomerAdapter
import com.stripe.android.customersheet.ExperimentalCustomerSheetApi
import com.stripe.android.model.PaymentMethod
import kotlinx.coroutines.CompletableDeferred

@OptIn(ExperimentalCustomerSheetApi::class)
class ReactNativeCustomerAdapter (
  private val context: ReactApplicationContext,
  private val adapter: CustomerAdapter,
  private val overridesFetchPaymentMethods: Boolean,
  private val overridesAttachPaymentMethod: Boolean,
  private val overridesDetachPaymentMethod: Boolean,
  private val overridesSetSelectedPaymentOption: Boolean,
  private val overridesFetchSelectedPaymentOption: Boolean,
  private val overridesSetupIntentClientSecretForCustomerAttach: Boolean
) : CustomerAdapter by adapter {
  internal var fetchPaymentMethodsCallback: CompletableDeferred<List<PaymentMethod>>? = null
  internal var attachPaymentMethodCallback: CompletableDeferred<PaymentMethod>? = null
  internal var detachPaymentMethodCallback: CompletableDeferred<PaymentMethod>? = null
  internal var setSelectedPaymentOptionCallback: CompletableDeferred<Unit>? = null
  internal var fetchSelectedPaymentOptionCallback: CompletableDeferred<String?>? = null
  internal var setupIntentClientSecretForCustomerAttachCallback: CompletableDeferred<String>? = null

  override suspend fun retrievePaymentMethods(): CustomerAdapter.Result<List<PaymentMethod>> {
    if (overridesFetchPaymentMethods) {
      CompletableDeferred<List<PaymentMethod>>().also {
        fetchPaymentMethodsCallback = it
        emitEvent("onCustomerAdapterFetchPaymentMethodsCallback", Arguments.createMap())
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(resultFromJavascript)
      }
    }

    return adapter.retrievePaymentMethods()
  }

  override suspend fun attachPaymentMethod(paymentMethodId: String): CustomerAdapter.Result<PaymentMethod> {
    if (overridesAttachPaymentMethod) {
      CompletableDeferred<PaymentMethod>().also {
        attachPaymentMethodCallback = it
        val params = Arguments.createMap().also {
          it.putString("paymentMethodId", paymentMethodId)
        }
        emitEvent("onCustomerAdapterAttachPaymentMethodCallback", params)
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(resultFromJavascript)
      }
    }

    return adapter.attachPaymentMethod(paymentMethodId)
  }

  override suspend fun detachPaymentMethod(paymentMethodId: String): CustomerAdapter.Result<PaymentMethod> {
    if (overridesDetachPaymentMethod) {
      CompletableDeferred<PaymentMethod>().also {
        detachPaymentMethodCallback = it
        val params = Arguments.createMap().also {
          it.putString("paymentMethodId", paymentMethodId)
        }
        emitEvent("onCustomerAdapterDetachPaymentMethodCallback", params)
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(resultFromJavascript)
      }
    }

    return adapter.detachPaymentMethod(paymentMethodId)
  }

  override suspend fun setSelectedPaymentOption(paymentOption: CustomerAdapter.PaymentOption?): CustomerAdapter.Result<Unit> {
    if (overridesSetSelectedPaymentOption) {
      CompletableDeferred<Unit>().also {
        setSelectedPaymentOptionCallback = it
        val params = Arguments.createMap().also {
          it.putString("paymentOption", paymentOption?.id)
        }
        emitEvent("onCustomerAdapterSetSelectedPaymentOptionCallback", params)
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(resultFromJavascript)
      }
    }

    return adapter.setSelectedPaymentOption(paymentOption)
  }

  override suspend fun retrieveSelectedPaymentOption(): CustomerAdapter.Result<CustomerAdapter.PaymentOption?> {
    if (overridesFetchSelectedPaymentOption) {
      CompletableDeferred<String?>().also {
        fetchSelectedPaymentOptionCallback = it
        emitEvent("onCustomerAdapterFetchSelectedPaymentOptionCallback", Arguments.createMap())
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(
          if (resultFromJavascript != null) {
            CustomerAdapter.PaymentOption.fromId(resultFromJavascript)
          } else {
            null
          }
        )
      }
    }

    return adapter.retrieveSelectedPaymentOption()
  }

  override suspend fun setupIntentClientSecretForCustomerAttach(): CustomerAdapter.Result<String> {
    if (overridesSetupIntentClientSecretForCustomerAttach) {
      CompletableDeferred<String>().also {
        setupIntentClientSecretForCustomerAttachCallback = it
        emitEvent("onCustomerAdapterSetupIntentClientSecretForCustomerAttachCallback", Arguments.createMap())
        val resultFromJavascript = it.await()
        return CustomerAdapter.Result.success(resultFromJavascript)
      }
    }

    return adapter.setupIntentClientSecretForCustomerAttach()
  }

  private fun emitEvent(eventName: String, params: WritableMap) {
    val stripeSdkModule: StripeSdkModule? = context.getNativeModule(StripeSdkModule::class.java)
    if (stripeSdkModule == null || stripeSdkModule.eventListenerCount == 0) {
      Log.e(
        "StripeReactNative",
        "Tried to call $eventName, but no callback was found. Please file an issue: https://github.com/stripe/stripe-react-native/issues"
      )
    }

    stripeSdkModule?.sendEvent(context, eventName, params)
  }
}


