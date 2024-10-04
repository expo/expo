package abi46_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.graphics.drawable.DrawableCompat
import androidx.fragment.app.Fragment
import abi46_0_0.com.facebook.react.bridge.Promise
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.bridge.WritableMap
import abi46_0_0.com.facebook.react.bridge.WritableNativeMap
import com.stripe.android.paymentsheet.PaymentOptionCallback
import com.stripe.android.paymentsheet.PaymentSheet
import com.stripe.android.paymentsheet.PaymentSheetResult
import com.stripe.android.paymentsheet.PaymentSheetResultCallback
import java.io.ByteArrayOutputStream

class PaymentSheetFragment(
  private val context: ReactApplicationContext,
  private val initPromise: Promise
) : Fragment() {
  private var paymentSheet: PaymentSheet? = null
  private var flowController: PaymentSheet.FlowController? = null
  private var paymentIntentClientSecret: String? = null
  private var setupIntentClientSecret: String? = null
  private lateinit var paymentSheetConfiguration: PaymentSheet.Configuration
  private var confirmPromise: Promise? = null
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
    val merchantDisplayName = arguments?.getString("merchantDisplayName").orEmpty()
    val customerId = arguments?.getString("customerId").orEmpty()
    val customerEphemeralKeySecret = arguments?.getString("customerEphemeralKeySecret").orEmpty()
    val countryCode = arguments?.getString("merchantCountryCode").orEmpty()
    val currencyCode = arguments?.getString("currencyCode").orEmpty()
    val googlePayEnabled = arguments?.getBoolean("googlePay")
    val testEnv = arguments?.getBoolean("testEnv")
    val allowsDelayedPaymentMethods = arguments?.getBoolean("allowsDelayedPaymentMethods")
    val billingDetailsBundle = arguments?.getBundle("defaultBillingDetails")
    paymentIntentClientSecret = arguments?.getString("paymentIntentClientSecret").orEmpty()
    setupIntentClientSecret = arguments?.getString("setupIntentClientSecret").orEmpty()
    val appearance = try {
      buildPaymentSheetAppearance(arguments?.getBundle("appearance"))
    } catch (error: PaymentSheetAppearanceException) {
      initPromise.resolve(createError(ErrorType.Failed.toString(), error))
      return
    }

    val paymentOptionCallback = PaymentOptionCallback { paymentOption ->
      if (paymentOption != null) {
        val bitmap = getBitmapFromVectorDrawable(context, paymentOption.drawableResourceId)
        val imageString = getBase64FromBitmap(bitmap)
        val option: WritableMap = WritableNativeMap()
        option.putString("label", paymentOption.label)
        option.putString("image", imageString)
        presentPromise?.resolve(createResult("paymentOption", option))
      } else {
        presentPromise?.resolve(createError(PaymentSheetErrorType.Canceled.toString(), "The payment option selection flow has been canceled"))
      }
    }

    val paymentResultCallback = PaymentSheetResultCallback { paymentResult ->
      when (paymentResult) {
        is PaymentSheetResult.Canceled -> {
          val message = "The payment flow has been canceled"
          confirmPromise?.resolve(createError(PaymentSheetErrorType.Canceled.toString(), message))
            ?: run {
              presentPromise?.resolve(createError(PaymentSheetErrorType.Canceled.toString(), message))
            }
        }
        is PaymentSheetResult.Failed -> {
          confirmPromise?.resolve(createError(PaymentSheetErrorType.Failed.toString(), paymentResult.error))
            ?: run {
              presentPromise?.resolve(createError(PaymentSheetErrorType.Failed.toString(), paymentResult.error))
            }
        }
        is PaymentSheetResult.Completed -> {
          confirmPromise?.resolve(WritableNativeMap()) ?: run {
            presentPromise?.resolve(WritableNativeMap())
          }
        }
      }
      (context.currentActivity as? AppCompatActivity)?.supportFragmentManager?.beginTransaction()?.remove(this)?.commitAllowingStateLoss()
    }

    var defaultBillingDetails: PaymentSheet.BillingDetails? = null
    if (billingDetailsBundle != null) {
      val addressBundle = billingDetailsBundle.getBundle("address")
      val address = PaymentSheet.Address(
        addressBundle?.getString("city"),
        addressBundle?.getString("country"),
        addressBundle?.getString("line1"),
        addressBundle?.getString("line2"),
        addressBundle?.getString("postalCode"),
        addressBundle?.getString("state")
      )
      defaultBillingDetails = PaymentSheet.BillingDetails(
        address,
        billingDetailsBundle.getString("email"),
        billingDetailsBundle.getString("name"),
        billingDetailsBundle.getString("phone")
      )
    }

    paymentSheetConfiguration = PaymentSheet.Configuration(
      merchantDisplayName = merchantDisplayName,
      allowsDelayedPaymentMethods = allowsDelayedPaymentMethods ?: false,
      defaultBillingDetails = defaultBillingDetails,
      customer = if (customerId.isNotEmpty() && customerEphemeralKeySecret.isNotEmpty()) PaymentSheet.CustomerConfiguration(
        id = customerId,
        ephemeralKeySecret = customerEphemeralKeySecret
      ) else null,
      googlePay = if (googlePayEnabled == true) PaymentSheet.GooglePayConfiguration(
        environment = if (testEnv == true) PaymentSheet.GooglePayConfiguration.Environment.Test else PaymentSheet.GooglePayConfiguration.Environment.Production,
        countryCode = countryCode,
        currencyCode = currencyCode
      ) else null,
      appearance = appearance
    )

    if (arguments?.getBoolean("customFlow") == true) {
      flowController = PaymentSheet.FlowController.create(this, paymentOptionCallback, paymentResultCallback)
      configureFlowController()
    } else {
      paymentSheet = PaymentSheet(this, paymentResultCallback)
      initPromise.resolve(WritableNativeMap())
    }
  }

  fun present(promise: Promise) {
    this.presentPromise = promise
    if (paymentSheet != null) {
      if (!paymentIntentClientSecret.isNullOrEmpty()) {
        paymentSheet?.presentWithPaymentIntent(paymentIntentClientSecret!!, paymentSheetConfiguration)
      } else if (!setupIntentClientSecret.isNullOrEmpty()) {
        paymentSheet?.presentWithSetupIntent(setupIntentClientSecret!!, paymentSheetConfiguration)
      }
    } else if (flowController != null) {
      flowController?.presentPaymentOptions()
    }
  }

  fun confirmPayment(promise: Promise) {
    this.confirmPromise = promise
    flowController?.confirm()
  }

  private fun configureFlowController() {
    val onFlowControllerConfigure = PaymentSheet.FlowController.ConfigCallback { _, _ ->
      val result = flowController?.getPaymentOption()?.let {
        val bitmap = getBitmapFromVectorDrawable(context, it.drawableResourceId)
        val imageString = getBase64FromBitmap(bitmap)
        val option: WritableMap = WritableNativeMap()
        option.putString("label", it.label)
        option.putString("image", imageString)
        createResult("paymentOption", option)
      } ?: run {
        WritableNativeMap()
      }
      initPromise.resolve(result)
    }

    if (!paymentIntentClientSecret.isNullOrEmpty()) {
      flowController?.configureWithPaymentIntent(
        paymentIntentClientSecret = paymentIntentClientSecret!!,
        configuration = paymentSheetConfiguration,
        callback = onFlowControllerConfigure
      )
    } else if (!setupIntentClientSecret.isNullOrEmpty()) {
      flowController?.configureWithSetupIntent(
        setupIntentClientSecret = setupIntentClientSecret!!,
        configuration = paymentSheetConfiguration,
        callback = onFlowControllerConfigure
      )
    }
  }
}

fun getBitmapFromVectorDrawable(context: Context?, drawableId: Int): Bitmap? {
  var drawable = AppCompatResources.getDrawable(context!!, drawableId) ?: return null

  drawable = DrawableCompat.wrap(drawable).mutate()
  val bitmap = Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
  bitmap.eraseColor(Color.WHITE)
  val canvas = Canvas(bitmap)
  drawable.setBounds(0, 0, canvas.width, canvas.height)
  drawable.draw(canvas)
  return bitmap
}

fun getBase64FromBitmap(bitmap: Bitmap?): String? {
  if (bitmap == null) {
    return null
  }
  val stream = ByteArrayOutputStream()
  bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
  val imageBytes: ByteArray = stream.toByteArray()
  return Base64.encodeToString(imageBytes, Base64.DEFAULT)
}
