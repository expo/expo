package expo.modules.updates

import android.app.Application
import android.content.Context
import androidx.annotation.UiThread
import androidx.annotation.WorkerThread
import com.facebook.react.ReactActivity
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactNativeHostHandler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Defines the internal and exported modules for expo-updates, as well as the auto-setup behavior in
 * applicable environments.
 */
class UpdatesPackage : Package {
  private val useNativeDebug = BuildConfig.EX_UPDATES_NATIVE_DEBUG

  override fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> {
    val handler: ReactNativeHostHandler = object : ReactNativeHostHandler {

      override fun getJSBundleFile(useDeveloperSupport: Boolean): String? {
        return if (shouldActivateUpdates(useDeveloperSupport)) UpdatesController.instance.launchAssetFile else null
      }

      override fun getBundleAssetName(useDeveloperSupport: Boolean): String? {
        return if (shouldActivateUpdates(useDeveloperSupport)) UpdatesController.instance.bundleAssetName else null
      }

      override fun onWillCreateReactInstance(useDeveloperSupport: Boolean) {
        UpdatesController.initialize(context)
      }

      override fun onDidCreateReactInstance(useDeveloperSupport: Boolean, reactContext: ReactContext) {
        UpdatesController.instance.onDidCreateReactInstanceManager(reactContext)
      }

      override fun onReactInstanceException(useDeveloperSupport: Boolean, exception: Exception) {
        UpdatesController.instance.onReactInstanceException(exception)
      }
    }
    return listOf(handler)
  }

  override fun createReactActivityHandlers(activityContext: Context): List<ReactActivityHandler> {
    val handler = object : ReactActivityHandler {
      override fun getDelayLoadAppHandler(activity: ReactActivity, reactNativeHost: ReactNativeHost): ReactActivityHandler.DelayLoadAppHandler? {
        if (!BuildConfig.EX_UPDATES_ANDROID_DELAY_LOAD_APP) {
          return null
        }
        val context = activity.applicationContext
        val useDeveloperSupport = reactNativeHost.useDeveloperSupport
        if (shouldActivateUpdates(useDeveloperSupport)) {
          return ReactActivityHandler.DelayLoadAppHandler { whenReadyRunnable ->
            CoroutineScope(Dispatchers.IO).launch {
              startUpdatesController(context)
              invokeReadyRunnable(whenReadyRunnable)
            }
          }
        }
        return null
      }

      @WorkerThread
      private suspend fun startUpdatesController(context: Context) {
        withContext(Dispatchers.IO) {
          UpdatesController.initialize(context)
          // Call the synchronous `launchAssetFile()` function to wait for updates ready
          UpdatesController.instance.launchAssetFile
        }
      }

      @UiThread
      private suspend fun invokeReadyRunnable(whenReadyRunnable: Runnable) {
        withContext(Dispatchers.Main) {
          whenReadyRunnable.run()
        }
      }
    }

    return listOf(handler)
  }

  override fun createApplicationLifecycleListeners(context: Context): List<ApplicationLifecycleListener> {
    val handler = object : ApplicationLifecycleListener {
      override fun onCreate(application: Application) {
        super.onCreate(application)
        if (isRunningAndroidTest()) {
          // Preload updates to prevent Detox ANR
          UpdatesController.initialize(context)
          UpdatesController.instance.launchAssetFile
        }
      }
    }

    return listOf(handler)
  }

  /**
   * Indicates that expo-updates should be activated and fully functional:
   * - Release build (useDeveloperSupport=false)
   * - or EX_UPDATES_NATIVE_DEBUG=1
   */
  private fun shouldActivateUpdates(useDeveloperSupport: Boolean): Boolean =
    useNativeDebug || !useDeveloperSupport

  private fun isRunningAndroidTest(): Boolean {
    try {
      Class.forName("androidx.test.espresso.Espresso")
      return true
    } catch (_: ClassNotFoundException) {
    }
    return false
  }

  companion object {
    private val TAG = UpdatesPackage::class.java.simpleName
  }
}
