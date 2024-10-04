package host.exp.exponent.devsupport

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.View
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaJSExecutor
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.ReactSurfaceImpl
import versioned.host.exp.exponent.ExponentDevBundleDownloadListener
import versioned.host.exp.exponent.VersionedUtils


class ExpoDevSupportManager(
  context: Context,
  private val reactHost: ReactHostImpl,
  packagerPathForJSBundleName: String,
  devBundleDownloadListener: DevBundleDownloadListener? = null
) : DevSupportManagerBase(
  context.applicationContext,
  createInstanceDevHelper(reactHost),
  packagerPathForJSBundleName,
  true,
  null,
  devBundleDownloadListener,
  100,
  VersionedUtils.createPackagerCommandHelpers(),
  null,
  null,
  null
) {
  @Suppress("INAPPLICABLE_JVM_NAME")
  @get:JvmName("getjSBundleURLForRemoteDebugging")
  override val jSBundleURLForRemoteDebugging: String? = super.jSBundleURLForRemoteDebugging

  override fun loadSplitBundleFromServer(bundlePath: String, callback: DevSplitBundleCallback) {
    fetchSplitBundleAndCreateBundleLoader(
      bundlePath,
      object : CallbackWithBundleLoader {
        override fun onSuccess(bundleLoader: JSBundleLoader) {
          reactHost
            .loadBundle(bundleLoader)
            .onSuccess { task ->
              if (task.getResult() == true) {
                val bundleURL =
                  devServerHelper.getDevServerSplitBundleURL(bundlePath)
                val reactContext = reactHost.currentReactContext
                reactContext?.getJSModule(HMRClient::class.java)
                  ?.registerBundle(bundleURL)
                callback.onSuccess()
              }
            }
        }

        override fun onError(url: String, cause: Throwable) {
          callback.onError(url, cause)
        }
      })
  }

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    hideRedboxDialog()
    reactHost.reload("BridgelessDevSupportManager.handleReloadJS()")
  }

  override fun getUniqueTag() = "ExpoGo-Bridgeless"

  companion object {
    private fun createInstanceDevHelper(reactHost: ReactHostImpl): ReactInstanceDevHelper {
      return object : ReactInstanceDevHelper {
        override fun onReloadWithJSDebugger(proxyExecutorFactory: JavaJSExecutor.Factory) {
          // Not implemented, only used by BridgeDevSupportManager to reload with proxy executor
        }

        override fun onJSBundleLoadedFromServer() {
          // Not implemented, only referenced by BridgeDevSupportManager
        }

        override fun toggleElementInspector() {
          val reactContext = reactHost.currentReactContext
          reactContext?.getJSModule(
            DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
          )
            ?.emit("toggleElementInspector", null)
        }

        override fun getCurrentActivity(): Activity? {
          return reactHost.getLastUsedActivity()
        }

        override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory {
          throw IllegalStateException("Not implemented for bridgeless mode")
        }

        override fun createRootView(appKey: String): View? {
          val currentActivity = currentActivity
          if (currentActivity != null && !reactHost.isSurfaceWithModuleNameAttached(appKey)) {
            val reactSurface =
              ReactSurfaceImpl.createWithView(currentActivity, appKey, Bundle())
            reactSurface.attach(reactHost)
            reactSurface.start()

            return reactSurface.view
          }
          return null
        }

        override fun destroyRootView(rootView: View) {
        }
      }
    }
  }
}
