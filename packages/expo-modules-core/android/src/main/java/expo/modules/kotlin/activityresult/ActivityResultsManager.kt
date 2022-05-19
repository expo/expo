package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContract
import androidx.appcompat.app.AppCompatActivity
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
  private val registry = AppContextActivityResultRegistry(currentActivityProvider)


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
