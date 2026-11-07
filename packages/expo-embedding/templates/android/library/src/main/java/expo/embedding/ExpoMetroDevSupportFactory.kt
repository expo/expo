package expo.embedding

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import java.util.concurrent.CompletableFuture
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

internal class ExpoMetroDevSupportFactory : DevSupportManagerFactory {
  @Deprecated("Use the overload with useDevSupport for the New Architecture.")
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
  ): DevSupportManager = error("Expo embedding requires React Native's New Architecture. Enable newArchEnabled in gradle.properties and rebuild.")

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
    useDevSupport: Boolean,
  ): DevSupportManager {
    if (!useDevSupport) {
      return ReleaseDevSupportManager()
    }
    return object : DevSupportManagerBase(
      applicationContext, reactInstanceManagerHelper, packagerPathForJSBundleName, false,
      redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers,
      surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager,
    ) {
      override val uniqueTag: String
        get() = "ExpoEmbedding"

      override fun handleReloadJS() {
        hideRedboxDialog()
        reactInstanceDevHelper.reload("Expo embedding reload")
      }

      private val metroAvailable: CompletableFuture<Boolean> by lazy {
        val url = devServerHelper.getDevServerBundleURL(".expo/.virtual-metro-entry")
          .toHttpUrlOrNull()?.newBuilder()?.encodedPath("/status")?.query(null)?.build()
          ?: return@lazy CompletableFuture.completedFuture(false)
        ExpoMetroConnection.findServer(url, BuildConfig.METRO_PROJECT_ROOT).thenApply { server ->
          if (server != null) {
            devSettings.packagerConnectionSettings.debugServerHost = server.toUri().rawAuthority
            devSupportEnabled = true
          }
          server != null
        }
      }

      override fun isPackagerRunning(callback: PackagerStatusCallback) {
        metroAvailable.thenAccept { callback.onPackagerStatusFetched(it) }
      }
    }
  }
}
