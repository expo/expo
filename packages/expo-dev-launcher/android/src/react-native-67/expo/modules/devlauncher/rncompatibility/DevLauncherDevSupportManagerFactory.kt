package expo.modules.devlauncher.rncompatibility

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.DisabledDevSupportManager
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.RedBoxHandler
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.RequestHandler

class DevLauncherDevSupportManagerFactory : DevSupportManagerFactory {
  override fun create(
    applicationContext: Context,
    reactInstanceManagerHelper: ReactInstanceDevHelper,
    packagerPathForJSBundleName: String?,
    enableOnCreate: Boolean,
    redBoxHandler: RedBoxHandler?,
    devBundleDownloadListener: DevBundleDownloadListener?,
    minNumShakes: Int,
    customPackagerCommandHandlers: Map<String, RequestHandler>?,
    surfaceDelegateFactory: SurfaceDelegateFactory?
  ): DevSupportManager {
    return if (!enableOnCreate) {
      DisabledDevSupportManager()
    } else {
      DevLauncherDevSupportManager(
        applicationContext,
        reactInstanceManagerHelper,
        packagerPathForJSBundleName,
        enableOnCreate,
        redBoxHandler,
        devBundleDownloadListener,
        minNumShakes,
        customPackagerCommandHandlers?.toMutableMap()
      )
    }
  }
}
