package abi49_0_0.expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.annotation.UiThread
import androidx.annotation.WorkerThread
import abi49_0_0.com.facebook.react.ReactActivity
import abi49_0_0.com.facebook.react.ReactInstanceManager
import abi49_0_0.com.facebook.react.ReactNativeHost
import abi49_0_0.expo.modules.core.ExportedModule
import abi49_0_0.expo.modules.core.interfaces.Package
import abi49_0_0.expo.modules.core.interfaces.InternalModule
import abi49_0_0.expo.modules.core.interfaces.ReactActivityHandler
import abi49_0_0.expo.modules.core.interfaces.ReactNativeHostHandler

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesController
/* ktlint-enable no-unused-imports */

/**
 * Defines the internal and exported modules for expo-updates, as well as the auto-setup behavior in
 * applicable environments.
 */
class UpdatesPackage : Package {
  private val useNativeDebug = false
  private var mShouldAutoSetup: Boolean? = null

  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf(UpdatesService(context) as InternalModule)
  }

  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(UpdatesModule(context) as ExportedModule)
  }

  override fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> {
    val handler: ReactNativeHostHandler = object : ReactNativeHostHandler {

      override fun getJSBundleFile(useDeveloperSupport: Boolean): String? {
        return if (shouldAutoSetup(context) && (useNativeDebug || !useDeveloperSupport)) UpdatesController.instance.launchAssetFile else null
      }

      override fun getBundleAssetName(useDeveloperSupport: Boolean): String? {
        return if (shouldAutoSetup(context) && (useNativeDebug || !useDeveloperSupport)) UpdatesController.instance.bundleAssetName else null
      }

      override fun onWillCreateReactInstanceManager(useDeveloperSupport: Boolean) {
        if (shouldAutoSetup(context) && (useNativeDebug || !useDeveloperSupport)) {
          UpdatesController.initialize(context)
        }
      }

      override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager, useDeveloperSupport: Boolean) {
      }
    }
    return listOf(handler)
  }

  override fun createReactActivityHandlers(activityContext: Context): List<ReactActivityHandler> {
    val handler = object : ReactActivityHandler {
      override fun getDelayLoadAppHandler(activity: ReactActivity, reactNativeHost: ReactNativeHost): ReactActivityHandler.DelayLoadAppHandler? {
        if (!false) {
          return null
        }
        val context = activity.applicationContext
        val useDeveloperSupport = reactNativeHost.useDeveloperSupport
        if (shouldAutoSetup(context) && (useNativeDebug || !useDeveloperSupport)) {
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

  private fun shouldAutoSetup(context: Context): Boolean {
    if (mShouldAutoSetup == null) {
      mShouldAutoSetup = try {
        val pm = context.packageManager
        val ai = pm.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        ai.metaData.getBoolean("expo.modules.updates.AUTO_SETUP", true)
      } catch (e: Exception) {
        Log.e(TAG, "Could not read expo-updates configuration data in AndroidManifest", e)
        true
      }
    }
    return mShouldAutoSetup!!
  }

  companion object {
    private val TAG = UpdatesPackage::class.java.simpleName
  }
}
