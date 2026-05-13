package host.exp.exponent.factories

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import host.exp.exponent.modules.perfmonitor.ExpoBridgelessDevSupportManager
import versioned.host.exp.exponent.VersionedUtils

class ExpoGoDevSupportFactory(private val devBundleDownloadListener: DevBundleDownloadListener?, private val minNumShakes: Int = 100) : DevSupportManagerFactory {
  override fun create(
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
  ): DevSupportManager {
    // This method was used only by legacy architecture and is stubbed here.
    return ReleaseDevSupportManager()
  }

  override fun create(
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
    pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
    useDevSupport: Boolean
  ): DevSupportManager {
    if (!useDevSupport) {
      return ReleaseDevSupportManager()
    }

    return ExpoBridgelessDevSupportManager(
      applicationContext,
      reactInstanceManagerHelper,
      packagerPathForJSBundleName,
      enableOnCreate,
      redBoxHandler,
      this.devBundleDownloadListener,
      this.minNumShakes,
      VersionedUtils.createPackagerCommandHelpers(),
      surfaceDelegateFactory,
      devLoadingViewManager,
      pausedInDebuggerOverlayManager
    )
  }
}
