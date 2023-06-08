package expo.modules.devlauncher.rncompatibility

import android.content.Context
import android.util.Log
import android.widget.Toast
import com.facebook.common.logging.FLog
import com.facebook.debug.holder.PrinterHolder
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaJSExecutor
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.futures.SimpleSettableFuture
import com.facebook.react.devsupport.DevLauncherInternalSettingsWrapper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.WebsocketJavaScriptExecutor
import com.facebook.react.devsupport.WebsocketJavaScriptExecutor.JSExecutorConnectCallback
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity

import org.koin.core.component.inject
import java.io.File
import java.io.IOException
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

class DevLauncherDevSupportManager(
  applicationContext: Context?,
  val reactInstanceManagerHelper: ReactInstanceDevHelper?,
  packagerPathForJSBundleName: String?,
  enableOnCreate: Boolean,
  redBoxHandler: RedBoxHandler?,
  devBundleDownloadListener: DevBundleDownloadListener?,
  minNumShakes: Int,
  customPackagerCommandHandlers: MutableMap<String, RequestHandler>?,
) : DevSupportManagerBase(
  applicationContext,
  reactInstanceManagerHelper,
  packagerPathForJSBundleName,
  enableOnCreate,
  redBoxHandler,
  devBundleDownloadListener,
  minNumShakes,
  customPackagerCommandHandlers,
  null,
  null
),
  DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()
  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L65
  private var mIsSamplingProfilerEnabled = false
  private val devSettings: DevLauncherInternalSettingsWrapper = DevLauncherInternalSettingsWrapper(getDevSettings())

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L88-L128
  init {
    if (devSettings.isStartSamplingProfilerOnInit) {
      // Only start the profiler. If its already running, there is an error
      if (!mIsSamplingProfilerEnabled) {
        toggleJSSamplingProfiler()
      } else {
        Toast.makeText(
          applicationContext,
          "JS Sampling Profiler was already running, so did not start the sampling profiler",
          Toast.LENGTH_LONG
        )
          .show()
      }
    }

    addCustomDevOption(
      if (mIsSamplingProfilerEnabled) applicationContext!!.getString(
        R.string.catalyst_sample_profiler_disable
      ) else applicationContext!!.getString(
        R.string.catalyst_sample_profiler_enable
      )
    ) { toggleJSSamplingProfiler() }
  }

  override fun showNewJavaError(message: String?, e: Throwable) {
    if (!DevLauncherController.wasInitialized()) {
      Log.e("DevLauncher", "DevLauncher wasn't initialized. Couldn't intercept native error handling.")
      super.showNewJavaError(message, e)
      return
    }

    val activity = reactInstanceManagerHelper?.currentActivity
    if (activity == null || activity.isFinishing || activity.isDestroyed) {
      return
    }

    controller.onAppLoadedWithError()
    DevLauncherErrorActivity.showError(activity, DevLauncherAppError(message, e))
  }

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L131-L134
  override fun getUniqueTag() = "DevLauncherApp - Bridge"

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L136-L156
  override fun loadSplitBundleFromServer(
    bundlePath: String?,
    callback: DevSplitBundleCallback
  ) {
    fetchSplitBundleAndCreateBundleLoader(
      bundlePath,
      object : CallbackWithBundleLoader {
        override fun onSuccess(bundleLoader: JSBundleLoader) {
          bundleLoader.loadScript(currentContext!!.catalystInstance)
          currentContext!!
            .getJSModule(HMRClient::class.java)
            .registerBundle(devServerHelper.getDevServerSplitBundleURL(bundlePath))
          callback.onSuccess()
        }

        override fun onError(url: String, cause: Throwable) {
          callback.onError(url, cause)
        }
      }
    )
  }

  override fun startInspector() {
    // no-op for the default `startInspector` which would be implicitly called
    // right after `ReactInstanceManager` construction.
    // For dev-launcher, we should inject the correct dev server address and
    // call our customized `startInspectorWhenDevLauncherReady`.
    // Check `DevLauncherReactUtils.injectReactInterceptor()` for details.
  }

  fun startInspectorWhenDevLauncherReady() {
    super.startInspector()
  }

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L158-L165
  private fun getExecutorConnectCallback(
    future: SimpleSettableFuture<Boolean>
  ): JSExecutorConnectCallback {
    return object : JSExecutorConnectCallback {
      override fun onSuccess() {
        future.set(true)
        hideDevLoadingView()
      }

      override fun onFailure(cause: Throwable) {
        hideDevLoadingView()
        FLog.e(ReactConstants.TAG, "Failed to connect to debugger!", cause)
        future.setException(
          IOException(
            applicationContext.getString(R.string.catalyst_debug_error),
            cause
          )
        )
      }
    }
  }

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L179-L204
  private fun reloadJSInProxyMode() {
    // When using js proxy, there is no need to fetch JS bundle as proxy executor will do that
    // anyway
    devServerHelper.launchJSDevtools()
    val factory = JavaJSExecutor.Factory {
      val executor = WebsocketJavaScriptExecutor()
      val future = SimpleSettableFuture<Boolean>()
      executor.connect(
        devServerHelper.websocketProxyURL, getExecutorConnectCallback(future)
      )
      // TODO(t9349129) Don't use timeout
      try {
        future[90, TimeUnit.SECONDS]
        return@Factory executor
      } catch (e: ExecutionException) {
        throw (e.cause as Exception)
      } catch (e: InterruptedException) {
        throw RuntimeException(e)
      } catch (e: TimeoutException) {
        throw RuntimeException(e)
      }
    }
    reactInstanceDevHelper.onReloadWithJSDebugger(factory)
  }

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L206-L231
  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    ReactMarker.logMarker(
      ReactMarkerConstants.RELOAD,
      devSettings.packagerConnectionSettings.debugServerHost
    )

    // dismiss redbox if exists
    hideRedboxDialog()
    if (devSettings.isRemoteJSDebugEnabled) {
      PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Proxy")
      showDevLoadingViewForRemoteJSEnabled()
      reloadJSInProxyMode()
    } else {
      PrinterHolder.getPrinter()
        .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server")
      val bundleURL = devServerHelper
        .getDevServerBundleURL(Assertions.assertNotNull(jsAppBundleName))
      reloadJSFromServer(bundleURL)
    }
  }

  // copied from https://github.com/facebook/react-native/blob/aa4da248c12e3ba41ecc9f1c547b21c208d9a15f/ReactAndroid/src/main/java/com/facebook/react/devsupport/BridgeDevSupportManager.java#L233-L277
  /** Starts of stops the sampling profiler  */
  private fun toggleJSSamplingProfiler() {
    val javaScriptExecutorFactory = reactInstanceDevHelper.javaScriptExecutorFactory
    if (!mIsSamplingProfilerEnabled) {
      try {
        javaScriptExecutorFactory.startSamplingProfiler()
        Toast.makeText(applicationContext, "Starting Sampling Profiler", Toast.LENGTH_SHORT)
          .show()
      } catch (e: UnsupportedOperationException) {
        Toast.makeText(
          applicationContext,
          "$javaScriptExecutorFactory does not support Sampling Profiler",
          Toast.LENGTH_LONG
        )
          .show()
      } finally {
        mIsSamplingProfilerEnabled = true
      }
    } else {
      try {
        val outputPath: String = File.createTempFile(
          "sampling-profiler-trace", ".cpuprofile", applicationContext.cacheDir
        )
          .path
        javaScriptExecutorFactory.stopSamplingProfiler(outputPath)
        Toast.makeText(
          applicationContext,
          "Saved results from Profiler to $outputPath",
          Toast.LENGTH_LONG
        )
          .show()
      } catch (e: IOException) {
        FLog.e(
          ReactConstants.TAG,
          "Could not create temporary file for saving results from Sampling Profiler"
        )
      } catch (e: UnsupportedOperationException) {
        Toast.makeText(
          applicationContext,
          javaScriptExecutorFactory.toString() + "does not support Sampling Profiler",
          Toast.LENGTH_LONG
        )
          .show()
      } finally {
        mIsSamplingProfilerEnabled = false
      }
    }
  }

  companion object {
    fun getDevHelperInternalFieldName() = "mReactInstanceDevHelper"
  }
}
