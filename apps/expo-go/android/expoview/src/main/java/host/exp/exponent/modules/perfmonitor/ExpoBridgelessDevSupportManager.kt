package host.exp.exponent.modules.perfmonitor

import android.content.Context
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.BridgelessDevSupportManager
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

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
  BridgelessDevSupportManager(
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

  override fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean) {
    devSettings.isFpsDebugEnabled = isFpsDebugEnabled
    perfController.syncEnabledState(
      isFpsDebugEnabled,
      currentReactContext
    )
  }

  override fun onNewReactContextCreated(reactContext: ReactContext) {
    perfController.onContextCreated(reactContext)
    if (devSettings.isFpsDebugEnabled) {
      perfController.enable(reactContext)
    }
  }

  override fun onReactInstanceDestroyed(reactContext: ReactContext) {
    super.onReactInstanceDestroyed(reactContext)
    perfController.onContextDestroyed(reactContext)
  }
}
