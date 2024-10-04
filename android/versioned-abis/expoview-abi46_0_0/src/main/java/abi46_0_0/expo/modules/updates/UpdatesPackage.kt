package abi46_0_0.expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.annotation.UiThread
import abi46_0_0.com.facebook.react.ReactInstanceManager
import abi46_0_0.expo.modules.core.ExportedModule
import abi46_0_0.expo.modules.core.interfaces.Package
import abi46_0_0.expo.modules.core.interfaces.InternalModule
import abi46_0_0.expo.modules.core.interfaces.ReactNativeHostHandler

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesController
/* ktlint-enable no-unused-imports */

class UpdatesPackage : Package {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf(UpdatesService(context) as InternalModule)
  }

  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(UpdatesModule(context) as ExportedModule)
  }

  override fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> {
    val handler: ReactNativeHostHandler = object : ReactNativeHostHandler {
      private var mShouldAutoSetup: Boolean? = null

      override fun getJSBundleFile(useDeveloperSupport: Boolean): String? {
        return if (shouldAutoSetup(context) && !useDeveloperSupport) UpdatesController.instance.launchAssetFile else null
      }

      override fun getBundleAssetName(useDeveloperSupport: Boolean): String? {
        return if (shouldAutoSetup(context) && !useDeveloperSupport) UpdatesController.instance.bundleAssetName else null
      }

      override fun onWillCreateReactInstanceManager(useDeveloperSupport: Boolean) {
        if (shouldAutoSetup(context) && !useDeveloperSupport) {
          UpdatesController.initialize(context)
        }
      }

      override fun onDidCreateReactInstanceManager(reactInstanceManager: ReactInstanceManager, useDeveloperSupport: Boolean) {
      }

      @UiThread
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
    }
    return listOf(handler)
  }

  companion object {
    private val TAG = UpdatesPackage::class.java.simpleName
  }
}
