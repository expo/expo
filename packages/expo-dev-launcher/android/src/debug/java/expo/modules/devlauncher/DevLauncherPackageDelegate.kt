package expo.modules.devlauncher

import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.view.KeyEvent
import android.view.ViewGroup
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devlauncher.modules.DevLauncherModule
import expo.modules.devlauncher.react.DevLauncherReactNativeHostHandler
import expo.modules.devlauncher.services.DependencyInjection
import expo.modules.devmenu.AppInfo
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.kotlin.weak
import expo.modules.manifests.core.ExpoUpdatesManifest
import java.lang.ref.WeakReference

object DevLauncherPackageDelegate {
  fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(
      DevLauncherModule(reactContext)
    )

  fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> =
    listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application?) {
          check(application is ReactApplication)
          DevLauncherController.initialize(application)
        }
      }
    )

  fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> =
    listOf(
      object : ReactActivityLifecycleListener {
        override fun onNewIntent(intent: Intent?): Boolean {
          if (intent == null || activityContext == null || activityContext !is ReactActivity) {
            return false
          }
          return DevLauncherController.tryToHandleIntent(activityContext, intent)
        }
      }
    )

  fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        private var currentActivityHolder: WeakReference<Activity> = WeakReference(null)
        private val currentActivity
          get() = currentActivityHolder.get()
        private var reactHostHolder: WeakReference<ReactHost> = WeakReference(null)
        private val fragment by DevMenuApi.fragment { currentActivity }

        override fun onDidCreateReactActivityDelegateNotification(activity: ReactActivity?, delegate: ReactActivityDelegate?) {
          currentActivityHolder = activity.weak()
          reactHostHolder = delegate?.reactHost.weak()
        }

        override fun onDidCreateReactActivityDelegate(activity: ReactActivity, delegate: ReactActivityDelegate): ReactActivityDelegate? {
          return DevLauncherController.wrapReactActivityDelegate(
            activity,
            object : DevLauncherReactActivityDelegateSupplier {
              override fun get(): ReactActivityDelegate {
                return delegate
              }
            }
          )
        }

        override fun createReactRootViewContainer(activity: Activity): ViewGroup {
          return DevMenuApi.createFragmentHost(
            activity,
            reactHostHolder,
            preferences = requireNotNull(DependencyInjection.devMenuPreferences),
            goToHomeAction = { DevLauncherController.instance.navigateToLauncher() },
            appInfoProvider = { application, reactHost ->
              val defaultAppInfo = AppInfo.getAppInfo(application, reactHost)

              var newAppName = defaultAppInfo.appName
              var newAppVersion = defaultAppInfo.appVersion
              var newRuntimeVersion = defaultAppInfo.runtimeVersion
              var hostUrl = defaultAppInfo.hostUrl

              val devLauncher = DevLauncherController.instance
              val manifest = devLauncher.manifest
              if (manifest != null) {
                manifest.getName()?.let {
                  newAppName = it
                }

                manifest.getVersion()?.let {
                  newAppVersion = it
                }

                (manifest as? ExpoUpdatesManifest)?.getRuntimeVersion()?.let {
                  newRuntimeVersion = it
                }
              }

              devLauncher.manifestURL?.let {
                hostUrl = it.toString()
              }

              defaultAppInfo.copy(
                appName = newAppName,
                appVersion = newAppVersion,
                runtimeVersion = newRuntimeVersion,
                hostUrl = hostUrl
              )
            }
          )
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          val fragment = fragment ?: return false
          return fragment.onKeyUp(keyCode, event)
        }
      }
    )

  fun createReactNativeHostHandlers(context: Context): List<ReactNativeHostHandler> =
    listOf(DevLauncherReactNativeHostHandler(context))
}
