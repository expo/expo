package expo.modules.kotlin.activityresult

import android.app.Activity
import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.activityaware.AppCompatActivityAware
import expo.modules.kotlin.activityaware.AppCompatActivityAwareHelper
import expo.modules.kotlin.activityaware.HostActivityAware
import expo.modules.kotlin.activityaware.HostActivityAwareHelper
import expo.modules.kotlin.activityaware.OnActivityAvailableListener
import expo.modules.kotlin.activityaware.OnHostActivityAvailableListener
import expo.modules.kotlin.activityaware.withHostActivityAvailable
import expo.modules.kotlin.hostactivity.HostActivity
import expo.modules.kotlin.logger
import expo.modules.kotlin.providers.CurrentActivityProvider
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.Serializable
import java.util.concurrent.atomic.AtomicInteger

/**
 * Manager class that takes care of proper communication with [AppContextActivityResultRegistry]
 * It also monitors the needed lifecycle state using [HostActivityAwareHelper]
 */
@OptIn(DelicateCoroutinesApi::class)
@Suppress("DEPRECATION")
class ActivityResultsManager(
  currentActivityProvider: CurrentActivityProvider
) : AppContextActivityResultCaller, HostActivityAware, AppCompatActivityAware {
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
  private val hostActivityAwareHelper = HostActivityAwareHelper()

  /**
   * Kept for modules that still listen with the AppCompat-typed API.
   * It fires only when the host Activity extends [AppCompatActivity].
   */
  private val appCompatActivityAwareHelper = AppCompatActivityAwareHelper()

  init {
    GlobalScope.launch {
      withHostActivityAvailable { hostActivity ->
        registry.restoreInstanceState(hostActivity.activity)
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
   * then use `init` block with [withHostActivityAvailable].
   */
  fun onHostResume(hostActivity: HostActivity) {
    hostActivityAwareHelper.dispatchOnHostActivityAvailable(hostActivity)

    val activity = hostActivity.activity
    if (activity is AppCompatActivity) {
      appCompatActivityAwareHelper.dispatchOnActivityAvailable(activity)
    } else {
      warnAboutAppCompatListeners(activity, appCompatActivityAwareHelper.listeners)
    }
  }

  fun onHostResume(activity: AppCompatActivity) {
    onHostResume(HostActivity.from(activity))
  }

  fun onHostDestroy(hostActivity: HostActivity) {
    registry.persistInstanceState(hostActivity.activity)
  }

  fun onHostDestroy(activity: AppCompatActivity) {
    onHostDestroy(HostActivity.from(activity))
  }

  // endregion

  // region AppContextActivityResultCaller

  override suspend fun <I : Serializable, O> registerForActivityResult(
    contract: AppContextActivityResultContract<I, O>,
    fallbackCallback: AppContextActivityResultFallbackCallback<I, O>
  ): AppContextActivityResultLauncher<I, O> =
    withHostActivityAvailable { hostActivity ->
      registry.register(
        "AppContext_rq#${nextLocalRequestCode.getAndIncrement()}",
        hostActivity.activity,
        contract,
        fallbackCallback
      )
    }

  // endregion

  // region HostActivityAware

  override fun addOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener) {
    hostActivityAwareHelper.addOnHostActivityAvailableListener(listener)
  }

  override fun removeOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener) {
    hostActivityAwareHelper.removeOnHostActivityAvailableListener(listener)
  }

  // endregion

  // region AppCompatActivityAware

  override fun addOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    appCompatActivityAwareHelper.addOnActivityAvailableListener(listener)

    val activity = hostActivityAwareHelper.currentHostActivity?.activity ?: return
    if (activity !is AppCompatActivity) {
      warnAboutAppCompatListeners(activity, listOf(listener))
    }
  }

  override fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    appCompatActivityAwareHelper.removeOnActivityAvailableListener(listener)
  }

  // endregion

  private fun warnAboutAppCompatListeners(activity: Activity, listeners: List<OnActivityAvailableListener>) {
    if (listeners.isEmpty()) {
      return
    }
    val listenerNames = listeners.joinToString { it.javaClass.name }
    logger.error(
      "The listeners $listenerNames wait for an AppCompatActivity, but the host Activity ${activity.javaClass.name} " +
        "does not extend it, so they will never be called. Listen with HostActivityAware instead."
    )
  }
}
