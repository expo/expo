package abi44_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.content.res.AppCompatResources
import androidx.core.graphics.drawable.DrawableCompat
import androidx.fragment.app.Fragment
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.stripe.android.paymentsheet.*
import com.stripe.android.paymentsheet.model.PaymentOption
import java.io.ByteArrayOutputStream

class PaymentSheetFragment : Fragment() {
  private var paymentSheet: PaymentSheet? = null
  private var flowController: PaymentSheet.FlowController? = null
  private var paymentIntentClientSecret: String? = null
  private var setupIntentClientSecret: String? = null
  private lateinit var paymentSheetConfiguration: PaymentSheet.Configuration
  private lateinit var localBroadcastManager: LocalBroadcastManager

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    localBroadcastManager = LocalBroadcastManager.getInstance(requireContext())
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
    val googlePayEnabled = arguments?.getBoolean("googlePay")
    val testEnv = arguments?.getBoolean("testEnv")
    val allowsDelayedPaymentMethods = arguments?.getBoolean("allowsDelayedPaymentMethods")
    val primaryButtonColorHexStr = arguments?.getString("primaryButtonColor").orEmpty()
    val billingDetailsBundle = arguments?.getBundle("defaultBillingDetails")
    paymentIntentClientSecret = arguments?.getString("paymentIntentClientSecret").orEmpty()
    setupIntentClientSecret = arguments?.getString("setupIntentClientSecret").orEmpty()

    val paymentOptionCallback = object : PaymentOptionCallback {
      override fun onPaymentOption(paymentOption: PaymentOption?) {
        val intent = Intent(ON_PAYMENT_OPTION_ACTION)

        if (paymentOption != null) {
          val bitmap = getBitmapFromVectorDrawable(context, paymentOption.drawableResourceId)
          val imageString = getBase64FromBitmap(bitmap)

          intent.putExtra("label", paymentOption.label)
          intent.putExtra("image", imageString)
        }
        localBroadcastManager.sendBroadcast(intent)
      }
    }

    val paymentResultCallback = object : PaymentSheetResultCallback {
      override fun onPaymentSheetResult(paymentResult: PaymentSheetResult) {
        val intent = Intent(ON_PAYMENT_RESULT_ACTION)

        intent.putExtra("paymentResult", paymentResult)
        localBroadcastManager.sendBroadcast(intent)
      }
    }

    var primaryButtonColor: ColorStateList? = null
    if (primaryButtonColorHexStr != null && primaryButtonColorHexStr.isNotEmpty()) {
      primaryButtonColor = ColorStateList.valueOf(Color.parseColor(primaryButtonColorHexStr))
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
        billingDetailsBundle?.getString("email"),
        billingDetailsBundle?.getString("name"),
        billingDetailsBundle?.getString("phone")
      )
    }

    paymentSheetConfiguration = PaymentSheet.Configuration(
      merchantDisplayName = merchantDisplayName,
      allowsDelayedPaymentMethods = allowsDelayedPaymentMethods ?: false,
      primaryButtonColor = primaryButtonColor,
      defaultBillingDetails = defaultBillingDetails,
      customer = if (customerId.isNotEmpty() && customerEphemeralKeySecret.isNotEmpty()) PaymentSheet.CustomerConfiguration(
        id = customerId,
        ephemeralKeySecret = customerEphemeralKeySecret
      ) else null,
      googlePay = if (googlePayEnabled == true) PaymentSheet.GooglePayConfiguration(
        environment = if (testEnv == true) PaymentSheet.GooglePayConfiguration.Environment.Test else PaymentSheet.GooglePayConfiguration.Environment.Production,
        countryCode = countryCode
      ) else null
    )

    if (arguments?.getBoolean("customFlow") == true) {
      flowController = PaymentSheet.FlowController.create(this, paymentOptionCallback, paymentResultCallback)
      configureFlowController()
    } else {
      paymentSheet = PaymentSheet(this, paymentResultCallback)
      val intent = Intent(ON_INIT_PAYMENT_SHEET)
      localBroadcastManager.sendBroadcast(intent)
    }

    val intent = Intent(ON_FRAGMENT_CREATED)
    localBroadcastManager.sendBroadcast(intent)
  }

  fun present() {
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

  fun confirmPayment() {
    flowController?.confirm()
  }

  private fun configureFlowController() {
    val onFlowControllerConfigure = object : PaymentSheet.FlowController.ConfigCallback {
      override fun onConfigured(success: Boolean, error: Throwable?) {
        val paymentOption = flowController?.getPaymentOption()
        val intent = Intent(ON_CONFIGURE_FLOW_CONTROLLER)

        if (paymentOption != null) {
          val bitmap = getBitmapFromVectorDrawable(context, paymentOption.drawableResourceId)
          val imageString = getBase64FromBitmap(bitmap)

          intent.putExtra("label", paymentOption.label)
          intent.putExtra("image", imageString)
        }
        localBroadcastManager.sendBroadcast(intent)
      }
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
  var drawable: Drawable? = AppCompatResources.getDrawable(context!!, drawableId)

  if (drawable == null) {
    return null
  }

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
  val baos = ByteArrayOutputStream()
  bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos)
  val imageBytes: ByteArray = baos.toByteArray()
  return Base64.encodeToString(imageBytes, Base64.DEFAULT)
}
