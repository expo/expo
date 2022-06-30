package versioned.host.exp.exponent.modules.api.components.reactnativestripesdk

import android.app.Activity
import android.app.Activity.RESULT_OK
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.*
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning.AddToWalletButtonView
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning.EphemeralKeyProvider
import versioned.host.exp.exponent.modules.api.components.reactnativestripesdk.pushprovisioning.TapAndPayProxy
import com.stripe.android.pushProvisioning.PushProvisioningActivity
import com.stripe.android.pushProvisioning.PushProvisioningActivityStarter


object PushProvisioningProxy {
  private const val TAG = "StripePushProvisioning"
  private var description = "Added by Stripe"
  private var tokenRequiringTokenization: ReadableMap? = null

  fun getApiVersion(): String {
    return try {
      Class.forName("com.stripe.android.pushProvisioning.PushProvisioningActivity")
      PushProvisioningActivity.API_VERSION
    } catch (e: Exception) {
      Log.e(TAG, "PushProvisioning dependency not found")
      ""
    }
  }

  fun invoke(
          context: ReactApplicationContext,
          view: AddToWalletButtonView,
          cardDescription: String,
          ephemeralKey: String,
          token: ReadableMap?
  ) {
    try {
      Class.forName("com.stripe.android.pushProvisioning.PushProvisioningActivityStarter")
      description = cardDescription
      tokenRequiringTokenization = token
      createActivityEventListener(context, view)
      context.currentActivity?.let {
        DefaultPushProvisioningProxy().beginPushProvisioning(
          it,
          description,
          EphemeralKeyProvider(ephemeralKey)
        )
      } ?: run {
        view.dispatchEvent(
          createError(
            "Failed",
            "Activity doesn't exist yet. You can safely retry.")
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "PushProvisioning dependency not found")
    }
  }

  fun isCardInWallet(activity: Activity, cardLastFour: String, promise: Promise) {
    TapAndPayProxy.invoke(activity, cardLastFour, promise)
  }

  private fun createActivityEventListener(context: ReactApplicationContext, view: AddToWalletButtonView) {
    val listener = object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(activity, requestCode, resultCode, data)
        if (requestCode == TapAndPayProxy.REQUEST_CODE_TOKENIZE) {
          view.dispatchEvent(
            if (resultCode == RESULT_OK) null else mapError("Failed", "Failed to verify identity.", null, null, null, null)
          )
        } else if (requestCode == PushProvisioningActivityStarter.REQUEST_CODE) {
          if (resultCode == PushProvisioningActivity.RESULT_OK) {
            tokenRequiringTokenization?.let { tokenRequiringTokenization ->
              val tokenReferenceId = tokenRequiringTokenization.getString("id")
              if (tokenReferenceId.isNullOrBlank()) {
                view.dispatchEvent(
                  mapError("Failed", "Token object passed to `<AddToWalletButton />` is missing the `id` field.", null, null, null, null)
                )
              } else {
                TapAndPayProxy.tokenize(
                  activity,
                  tokenReferenceId,
                  tokenRequiringTokenization,
                  description
                )
              }
            } ?: run {
              view.dispatchEvent(null)
            }
          } else if (resultCode == PushProvisioningActivity.RESULT_ERROR) {
            data?.let {
              val error: PushProvisioningActivityStarter.Error = PushProvisioningActivityStarter.Error.fromIntent(data)
              view.dispatchEvent(
                mapError(error.code.toString(), error.message, null, null, null, null)
              )
            }
          }
        }
      }
    }
    context.addActivityEventListener(listener)
  }
}

class DefaultPushProvisioningProxy {
  fun beginPushProvisioning(
    activity: Activity,
    description: String,
    provider: EphemeralKeyProvider
  ) {
      PushProvisioningActivityStarter(
        activity,
        PushProvisioningActivityStarter.Args(description, provider, false)
      ).startForResult()
  }
}
