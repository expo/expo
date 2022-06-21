@file:OptIn(DelicateCoroutinesApi::class)

package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContract
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.activityaware.AppCompatActivityAware
import expo.modules.kotlin.activityaware.AppCompatActivityAwareHelper
import expo.modules.kotlin.activityaware.OnActivityAvailableListener
import expo.modules.kotlin.activityaware.withActivityAvailable
import expo.modules.kotlin.providers.CurrentActivityProvider
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicInteger

class ActivityResultsManager(
  private val currentActivityProvider: CurrentActivityProvider
) : AppContextActivityResultCaller, AppCompatActivityAware {
  private val activity: AppCompatActivity
    get() = requireNotNull(currentActivityProvider.currentActivity) { "Current Activity is not available at the moment" }

  /**
   * Due to the fact that [AppContext] is not coupled directly with the [Activity]'s lifecycle
   * it's impossible to subscribe all [Lifecycle]'s events properly.
   * That forces us to create our own [AppContextActivityResultRegistry].
   */
  private val nextLocalRequestCode = AtomicInteger()
  private val registry = AppContextActivityResultRegistry(currentActivityProvider)
  private val activityAwareHelper = AppCompatActivityAwareHelper()

  init {
    GlobalScope.launch {
      // this is launched only once per Activity life
      withActivityAvailable { activity ->
        registry.restoreInstanceState(activity)
      }
    }
  }

  // region Lifecycle

  fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    registry.dispatchResult(requestCode, resultCode, data)
  }

  /**
   * This function is called every time the [Activity] is resumed.
   * If you want to add some mechanism that fires only once (similar to how [Activity.onCreate] works),
   * then use `init` block with [withActivityAvailable].
   */
  fun onHostResume(activity: AppCompatActivity) {
    activityAwareHelper.dispatchOnActivityAvailable(activity)
  }

  fun onHostDestroy(activity: AppCompatActivity) {
    registry.persistInstanceState(activity)
  }

  // endregion

  // region AppContextActivityResultCaller

  override suspend fun <I, O, P> registerForActivityResult(
    contract: ActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultCallback<O, P>
  ): AppContextActivityResultLauncher<I, O, P> =
    withActivityAvailable { activity ->
      registry.register(
        "AppContext_rq#${nextLocalRequestCode.getAndIncrement()}",
        activity,
        contract,
        fallbackCallback
      )
    }

  // endregion

  // region ActivityAware

  override fun peekAvailableActivity(): AppCompatActivity? {
    return activityAwareHelper.peekAvailableActivity()
  }

  override fun addOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    activityAwareHelper.addOnActivityAvailableListener(listener)
  }

  override fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    activityAwareHelper.removeOnActivityAvailableListener(listener)
  }

  // endregion
}
