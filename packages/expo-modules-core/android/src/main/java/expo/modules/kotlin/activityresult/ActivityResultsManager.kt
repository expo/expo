package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
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
import java.io.Serializable
import java.util.concurrent.atomic.AtomicInteger

/**
 * Manager class that takes care of proper communication with [AppContextActivityResultRegistry]
 * It also monitors the needed lifecycle state using [AppCompatActivityAwareHelper]
 */
@OptIn(DelicateCoroutinesApi::class)
class ActivityResultsManager(
  currentActivityProvider: CurrentActivityProvider
) : AppContextActivityResultCaller, AppCompatActivityAware {
  /**
   * Due to the fact that [AppContext] is not coupled directly with the [Activity]'s lifecycle
   * it's impossible to subscribe all [Lifecycle]'s events properly.
   * That forces us to create our own [AppContextActivityResultRegistry].
   */
  private val registry = AppContextActivityResultRegistry(currentActivityProvider)
  private val nextLocalRequestCode = AtomicInteger()

  /**
   * Helper property that allows for waiting for [Activity] creation.
   * It is useful when some Module wants to register itself before the current [Activity] is made available.
   */
  private val activityAwareHelper = AppCompatActivityAwareHelper()

  init {
    GlobalScope.launch {
      withActivityAvailable { activity ->
        registry.restoreInstanceState(activity)
      }
    }
  }

  // region Lifecycle

  fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
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

  override suspend fun <I : Serializable, O> registerForActivityResult(
    contract: AppContextActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<I, O>
  ): AppContextActivityResultLauncher<I, O> =
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

  override fun addOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    activityAwareHelper.addOnActivityAvailableListener(listener)
  }

  override fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    activityAwareHelper.removeOnActivityAvailableListener(listener)
  }

  // endregion
}
