package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.ActivityOptionsCompat
import androidx.lifecycle.Lifecycle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.AppContextActivityResult
import expo.modules.kotlin.providers.CurrentActivityProvider
import java.util.concurrent.atomic.AtomicInteger
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class ActivityResultsManager(
  private val currentActivityProvider: CurrentActivityProvider
) : AppContextActivityResultCaller {
  private val activity: AppCompatActivity
    get() = requireNotNull(currentActivityProvider.currentActivity) { TODO() }

  /**
   * Due to the fact that [AppContext] is not coupled directly with the [Activity]'s lifecycle
   * it's impossible to subscribe all [Lifecycle]'s events properly.
   * That forces us to create our own [AppContextActivityResultRegistry].
   */
  private val nextLocalRequestCode = AtomicInteger()
  private val registry = object : AppContextActivityResultRegistry() {
    /**
     * This method is launching the asynchronous flow based on [ActivityCompat.requestPermissions], [ActivityCompat.startIntentSenderForResult] or [ActivityCompat.startActivityForResult]
     */
    override fun <I, O> onLaunch(requestCode: Int, contract: ActivityResultContract<I, O>, input: I, options: ActivityOptionsCompat?) {
      // Immediate result path
      val synchronousResult = contract.getSynchronousResult(activity, input)
      if (synchronousResult != null) {
        Handler(Looper.getMainLooper()).post { dispatchResult(requestCode, synchronousResult.value) }
        return
      }

      // Start activity path
      val intent = contract.createIntent(activity, input)
      var optionsBundle: Bundle? = null
      // If there are any extras, we should defensively set the classLoader
      if (intent.extras != null && intent.extras!!.classLoader == null) {
        intent.setExtrasClassLoader(activity.classLoader)
      }
      if (intent.hasExtra(ActivityResultContracts.StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)) {
        optionsBundle = intent.getBundleExtra(ActivityResultContracts.StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
        intent.removeExtra(ActivityResultContracts.StartActivityForResult.EXTRA_ACTIVITY_OPTIONS_BUNDLE)
      } else if (options != null) {
        optionsBundle = options.toBundle()
      }
      when (intent.action) {
        ActivityResultContracts.RequestMultiplePermissions.ACTION_REQUEST_PERMISSIONS -> {
          // requestPermissions path
          var permissions = intent.getStringArrayExtra(ActivityResultContracts.RequestMultiplePermissions.EXTRA_PERMISSIONS)
          if (permissions == null) {
            permissions = arrayOfNulls(0)
          }
          ActivityCompat.requestPermissions(activity, permissions, requestCode)
        }
        ActivityResultContracts.StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST -> {
          val request: IntentSenderRequest = intent.getParcelableExtra(ActivityResultContracts.StartIntentSenderForResult.EXTRA_INTENT_SENDER_REQUEST)!!
          try {
            // startIntentSenderForResult path
            ActivityCompat.startIntentSenderForResult(activity, request.intentSender,
              requestCode, request.fillInIntent, request.flagsMask,
              request.flagsValues, 0, optionsBundle)
          } catch (e: IntentSender.SendIntentException) {
            Handler(Looper.getMainLooper()).post {
              dispatchResult(requestCode, Activity.RESULT_CANCELED,
                Intent().setAction(ActivityResultContracts.StartIntentSenderForResult.ACTION_INTENT_SENDER_REQUEST)
                  .putExtra(ActivityResultContracts.StartIntentSenderForResult.EXTRA_SEND_INTENT_EXCEPTION, e))
            }
          }
        }
        else -> {
          // startActivityForResult path
          ActivityCompat.startActivityForResult(activity, intent, requestCode, optionsBundle)
        }
      }
    }
  }


  fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    registry.dispatchResult(requestCode, resultCode, data)
  }

// region AppContextActivityResultCaller

  override fun <I, O> registerForActivityResult(
    contract: ActivityResultContract<I, O>,
    callback: AppContextActivityResultCallback<O>,
  ): ActivityResultLauncher<I> {
    return registry.register(
      "AppContext_rq#${nextLocalRequestCode.getAndIncrement()}",
      activity,
      contract,
      callback
    )
  }

  override suspend fun <O> launchForActivityResult(
    contract: ActivityResultContract<Any?, O>
  ): AppContextActivityResult<O> = suspendCoroutine { continuation ->
    registerForActivityResult(
      contract
    ) { output, launchingActivityHasBeenKilled ->
      continuation.resume(AppContextActivityResult(output, launchingActivityHasBeenKilled))
    }.launch(null)
  }

// endregion
}
