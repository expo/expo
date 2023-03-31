package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.*
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createError
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.createResult
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromPaymentIntentResult
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.utils.mapFromSetupIntentResult
import com.stripe.android.model.PaymentIntent
import com.stripe.android.model.SetupIntent
import com.stripe.android.model.StripeIntent
import com.stripe.android.payments.bankaccount.CollectBankAccountConfiguration
import com.stripe.android.payments.bankaccount.CollectBankAccountLauncher
import com.stripe.android.payments.bankaccount.navigation.CollectBankAccountResult

class CollectBankAccountLauncherFragment(
  private val context: ReactApplicationContext,
  private val publishableKey: String,
  private val stripeAccountId: String?,
  private val clientSecret: String,
  private val isPaymentIntent: Boolean,
  private val collectParams:  CollectBankAccountConfiguration.USBankAccount,
  private val promise: Promise
) : Fragment() {
  private lateinit var collectBankAccountLauncher: CollectBankAccountLauncher

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?,
                            savedInstanceState: Bundle?): View {
    collectBankAccountLauncher = createBankAccountLauncher()

    return FrameLayout(requireActivity()).also {
      it.visibility = View.GONE
    }
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(
      view,
      savedInstanceState)

    if (isPaymentIntent) {
      collectBankAccountLauncher.presentWithPaymentIntent(
        publishableKey,
        stripeAccountId,
        clientSecret,
        collectParams
      )
    } else {
      collectBankAccountLauncher.presentWithSetupIntent(
        publishableKey,
        stripeAccountId,
        clientSecret,
        collectParams
      )
    }
  }

  private fun createBankAccountLauncher(): CollectBankAccountLauncher {
    return CollectBankAccountLauncher.create(this) { result ->
      when (result) {
        is CollectBankAccountResult.Completed -> {
          val intent = result.response.intent
          if (intent.status === StripeIntent.Status.RequiresPaymentMethod) {
            promise.resolve(createError(ErrorType.Canceled.toString(), "Bank account collection was canceled."))
          } else if (intent.status === StripeIntent.Status.RequiresConfirmation) {
            promise.resolve(
              if (isPaymentIntent)
                createResult("paymentIntent", mapFromPaymentIntentResult(intent as PaymentIntent))
              else
                createResult("setupIntent", mapFromSetupIntentResult(intent as SetupIntent))
            )
          }
        }
        is CollectBankAccountResult.Cancelled -> {
          promise.resolve(createError(ErrorType.Canceled.toString(), "Bank account collection was canceled."))
        }
        is CollectBankAccountResult.Failed -> {
          promise.resolve(createError(ErrorType.Failed.toString(), result.error))
        }
      }
      removeFragment(context)
    }
  }

  companion object {
    internal const val TAG = "collect_bank_account_launcher_fragment"
  }
}
