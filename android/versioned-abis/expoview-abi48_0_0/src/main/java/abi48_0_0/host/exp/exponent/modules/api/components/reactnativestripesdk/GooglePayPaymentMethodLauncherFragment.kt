package abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.Fragment
import abi48_0_0.com.facebook.react.bridge.Promise
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi48_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.removeFragment
import com.stripe.android.googlepaylauncher.GooglePayEnvironment
import com.stripe.android.googlepaylauncher.GooglePayPaymentMethodLauncher

class GooglePayPaymentMethodLauncherFragment(
  private val context: ReactApplicationContext,
  private val isTestEnv: Boolean,
  private val paymentMethodRequired: Boolean,
  private val promise: Promise
) : Fragment() {
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
    GooglePayPaymentMethodLauncher(
      this,
      config = GooglePayPaymentMethodLauncher.Config(
        environment = if (isTestEnv) GooglePayEnvironment.Test else GooglePayEnvironment.Production,
        existingPaymentMethodRequired = paymentMethodRequired,
        merchantCountryCode = "", // Unnecessary since all we are checking for is Google Pay availability
        merchantName = "", // Same as above
      ),
      readyCallback = {
        promise.resolve(it)
        removeFragment(context)
      },
      resultCallback = {}
    )
  }

  companion object {
    const val TAG = "google_pay_support_fragment"
  }
}
