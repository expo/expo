package expo.modules.devlauncher.launcher

import android.content.Intent
import android.net.Uri
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.ReactContext
import expo.modules.devlauncher.DevLauncherController
import expo.modules.manifests.core.Manifest
import expo.modules.updatesinterface.UpdatesInterface
import kotlinx.coroutines.CoroutineScope

interface DevLauncherControllerInterface {
  suspend fun loadApp(url: Uri, mainActivity: ReactActivity? = null)
  suspend fun loadApp(url: Uri, projectUrl: Uri?, mainActivity: ReactActivity? = null)
  fun onAppLoaded(context: ReactContext)
  fun onAppLoadedWithError()
  fun getRecentlyOpenedApps(): List<DevLauncherAppEntry>
  fun clearRecentlyOpenedApps()
  fun navigateToLauncher()
  fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplierDevLauncher: DevLauncherReactActivityDelegateSupplier): ReactActivityDelegate
  fun handleIntent(intent: Intent?, activityToBeInvalidated: ReactActivity?): Boolean

  val manifest: Manifest?
  val manifestURL: Uri?
  val devClientHost: DevLauncherClientHost
  val mode: DevLauncherController.Mode
  val appHost: ReactNativeHost
  val latestLoadedApp: Uri?
  val useDeveloperSupport: Boolean
  var updatesInterface: UpdatesInterface?
  val coroutineScope: CoroutineScope
}
