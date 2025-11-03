package expo.modules.devmenu

import android.app.Activity
import android.app.Application
import android.content.Context
import android.view.KeyEvent
import android.view.ViewGroup
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devmenu.compose.DevMenuFragment
import expo.modules.devmenu.react.DevMenuInstaller
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class DevMenuPackage : Package {
  override fun createReactNativeHostHandlers(context: Context?): List<ReactNativeHostHandler?>? {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactNativeHostHandler {
        private var weakReactNativeHost = WeakReference<ReactHost>(null)

        override fun onDidCreateReactHost(context: Context, reactNativeHost: ReactHost) {
          super.onDidCreateReactHost(context, reactNativeHost)

          weakReactNativeHost = reactNativeHost.weak()
        }

        override fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {
          super.onDidCreateDevSupportManager(devSupportManager)

          if (devSupportManager !is DevSupportManagerBase) {
            return
          }

          DevMenuInstaller.install(devSupportManager)
        }
      }
    )
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityHandler {
        private var currentActivityHolder: WeakReference<Activity> = WeakReference(null)
        private val currentActivity
          get() = currentActivityHolder.get()
        private val fragment by DevMenuFragment.fragment { currentActivity }

        private var reactHostHolder: WeakReference<ReactHost> = WeakReference(null)

        override fun onDidCreateReactActivityDelegateNotification(activity: ReactActivity?, delegate: ReactActivityDelegate?) {
          currentActivityHolder = activity.weak()
          reactHostHolder = delegate?.reactHost.weak()
        }

        override fun createReactRootViewContainer(activity: Activity): ViewGroup {
          return DevMenuFragment.createFragmentHost(activity, reactHostHolder)
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          val fragment = fragment ?: return false
          return fragment.onKeyUp(keyCode, event)
        }
      }
    )
  }

  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener?>? {
    if (!BuildConfig.DEBUG) {
      return emptyList()
    }

    return listOf(
      object : ApplicationLifecycleListener {
        override fun onCreate(application: Application) {
          DevMenuPreferencesHandle.init(application)
          AppInfo.init(application)
        }
      }
    )
  }
}
