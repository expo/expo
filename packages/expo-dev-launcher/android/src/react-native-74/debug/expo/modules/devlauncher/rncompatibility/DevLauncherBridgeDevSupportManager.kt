package expo.modules.devlauncher.rncompatibility

import android.content.Context
import android.util.Log
import com.facebook.react.devsupport.NonFinalBridgeDevSupportManager
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.helpers.injectDevServerHelper
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.koin.optInject
import expo.modules.devlauncher.launcher.DevLauncherControllerInterface
import expo.modules.devlauncher.launcher.errors.DevLauncherAppError
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity

class DevLauncherBridgeDevSupportManager(
  applicationContext: Context,
  reactInstanceDevHelper: ReactInstanceDevHelper?,
  packagerPathForJSBundleName: String?,
  enableOnCreate: Boolean,
  redBoxHandler: RedBoxHandler?,
  devBundleDownloadListener: DevBundleDownloadListener?,
  minNumShakes: Int,
  customPackagerCommandHandlers: MutableMap<String, RequestHandler>?
) : NonFinalBridgeDevSupportManager(
  applicationContext,
  reactInstanceDevHelper,
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
  private val controller: DevLauncherControllerInterface? by optInject()

  init {
    injectDevServerHelper(applicationContext, this, controller)
  }

  override fun showNewJavaError(message: String?, e: Throwable) {
    Log.e("DevLauncher", "$message", e)
    if (!DevLauncherController.wasInitialized()) {
      Log.e(
        "DevLauncher",
        "DevLauncher wasn't initialized. Couldn't intercept native error handling."
      )
      super.showNewJavaError(message, e)
      return
    }

    val activity = reactInstanceDevHelper?.currentActivity
    if (activity == null || activity.isFinishing || activity.isDestroyed) {
      return
    }

    controller?.onAppLoadedWithError()
    DevLauncherErrorActivity.showError(activity, DevLauncherAppError(message, e))
  }

  override fun getUniqueTag() = "DevLauncherApp-Bridge"

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

  companion object {
    fun getDevHelperInternalFieldName() = "mReactInstanceDevHelper"
  }
}
