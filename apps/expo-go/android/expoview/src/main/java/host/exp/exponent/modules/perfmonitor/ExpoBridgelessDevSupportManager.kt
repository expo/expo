package host.exp.exponent.modules.perfmonitor

import android.content.Context
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import host.exp.exponent.kernel.Kernel

internal class ExpoBridgelessDevSupportManager(
  applicationContext: Context,
  reactInstanceManagerHelper: ReactInstanceDevHelper,
  packagerPathForJSBundleName: String?,
  enableOnCreate: Boolean,
  redBoxHandler: RedBoxHandler?,
  devBundleDownloadListener: DevBundleDownloadListener?,
  minNumShakes: Int,
  customPackagerCommandHandlers: Map<String, RequestHandler>?,
  surfaceDelegateFactory: SurfaceDelegateFactory?,
  devLoadingViewManager: DevLoadingViewManager?,
  pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
) :
  DevSupportManagerBase(
    applicationContext,
    reactInstanceManagerHelper,
    packagerPathForJSBundleName,
    enableOnCreate,
    redBoxHandler,
    devBundleDownloadListener,
    minNumShakes,
    customPackagerCommandHandlers,
    surfaceDelegateFactory,
    devLoadingViewManager,
    pausedInDebuggerOverlayManager
  ) {

  private val perfController = PerfMonitorController(applicationContext) {
    devSettings.isFpsDebugEnabled = false
  }

  // Expo Go runs one Activity per open project. Reload and bundle URL lookups are scoped to it.
  var exponentActivityId: Int = -1

  /**
   * Points React Native's dev server plumbing at this project's packager. React Native builds the
   * bundle, source map, HMR and inspector URLs from the host and bundle name. The manifest's other
   * query params carry the project's Metro configuration, such as the router root, and are
   * forwarded as-is because the dev server otherwise falls back to its own defaults.
   */
  fun setDevServer(bundleUrl: String) {
    val uri = Uri.parse(bundleUrl)
    val host = uri.host ?: return
    val port = if (uri.port != -1) uri.port else if (uri.scheme == "https") 443 else 80

    val settings = devSettings.packagerConnectionSettings
    settings.debugServerHost = "$host:$port"
    jsAppBundleName = uri.path?.removePrefix("/")?.removeSuffix(".bundle")?.ifEmpty { null } ?: "index"

    for (name in uri.queryParameterNames) {
      if (name in REACT_NATIVE_QUERY_PARAMS) {
        continue
      }
      uri.getQueryParameter(name)?.let { settings.setAdditionalOptionForPackager(name, it) }
    }
  }

  // Kept as "Bridgeless" because it keys persisted dev support state.
  override val uniqueTag: String
    get() = "Bridgeless"

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    hideRedboxDialog()

    try {
      // Reloading in Expo Go destroys the current Activity and creates a new one with a fresh React
      // instance, so drop the packager connection first. Otherwise a repeated reload, such as holding
      // "r" in the CLI, can re-enter this while the old instance is still tearing down.
      devServerHelper.closePackagerConnection()

      Kernel.reloadVisibleExperience(exponentActivityId)
    } catch (e: Exception) {
      Log.e(TAG, "Could not reload from the manifest, falling back to a JS reload", e)
      reactInstanceDevHelper.reload("ExpoBridgelessDevSupportManager.handleReloadJS() fallback")
    }
  }

  override fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean) {
    devSettings.isFpsDebugEnabled = isFpsDebugEnabled
    perfController.syncEnabledState(
      isFpsDebugEnabled,
      currentReactContext
    )
  }

  override fun onNewReactContextCreated(reactContext: ReactContext) {
    super.onNewReactContextCreated(reactContext)
    perfController.onContextCreated(reactContext)
    if (devSettings.isFpsDebugEnabled) {
      perfController.enable(reactContext)
    }
  }

  override fun onReactInstanceDestroyed(reactContext: ReactContext) {
    super.onReactInstanceDestroyed(reactContext)
    perfController.onContextDestroyed(reactContext)
  }

  private companion object {
    private val TAG = ExpoBridgelessDevSupportManager::class.java.simpleName

    // React Native puts these on the bundle URL itself, in DevServerHelper.createBundleURL.
    private val REACT_NATIVE_QUERY_PARAMS =
      setOf("platform", "dev", "lazy", "minify", "app", "modulesOnly", "runModule")
  }
}
