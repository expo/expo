package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResultCaller
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.activity.result.registerForActivityResult
import androidx.appcompat.app.AppCompatActivity
import expo.modules.kotlin.providers.AppCompatActivityProvider
import expo.modules.kotlin.AppContext
import java.util.concurrent.atomic.AtomicInteger

class ActivityResultsManager(
  private val activityProvider: AppCompatActivityProvider
): AppContextActivityResultCaller {
  private val activity: AppCompatActivity
    get() = requireNotNull(activityProvider.appCompatActivity) { TODO() }

  /**
   * Due to the fact that [AppContext] is not coupled directly with the [Activity]'s lifecycle
   * it's impossible to subscribe all [Lifecycle]'s events properly.
   * That forces us to create our own [AppContextActivityResultRegistry].
   */
  private val nextLocalRequestCode = AtomicInteger()
  private val registry = AppContextActivityResultRegistry(activityProvider)


  fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    registry.dispatchResult(requestCode, resultCode, data)
  }

  /**
   * A version of [ActivityResultCaller.registerForActivityResult]
   * that additionally takes an input right away, producing a launcher that doesn't take any
   * additional input when called.
   *
   * @see ActivityResultCaller.registerForActivityResult from `androidx.activity:activity-ktx:1.4.0`.
   */
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
}
