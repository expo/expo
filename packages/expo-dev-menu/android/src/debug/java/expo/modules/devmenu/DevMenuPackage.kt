package expo.modules.devmenu

import android.app.Activity
import android.content.Context
import android.view.KeyEvent
import android.view.ViewGroup
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactNativeHostHandler
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class DevMenuPackage : Package {
  override fun createReactNativeHostHandlers(context: Context?): List<ReactNativeHostHandler?> {
    if (!BuildConfig.AUTO_INITIALIZATION) {
      return emptyList()
    }

    return listOf(
      object : ReactNativeHostHandler {
        override fun onDidCreateDevSupportManager(devSupportManager: DevSupportManager) {
          super.onDidCreateDevSupportManager(devSupportManager)

          DevMenuApi.installWebSocketHandlers(devSupportManager)
          DevMenuApi.uninstallDefaultShakeDetector(devSupportManager)
        }
      }
    )
  }

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> {
    if (!BuildConfig.AUTO_INITIALIZATION) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityHandler {
        private var currentActivityHolder: WeakReference<Activity> = WeakReference(null)
        private val currentActivity
          get() = currentActivityHolder.get()
        private val fragment by DevMenuApi.fragment { currentActivity }

        private var reactHostHolder: WeakReference<ReactHost> = WeakReference(null)

        override fun onDidCreateReactActivityDelegateNotification(activity: ReactActivity?, delegate: ReactActivityDelegate?) {
          currentActivityHolder = activity.weak()
          reactHostHolder = delegate?.reactHost.weak()
        }

        override fun createReactRootViewContainer(activity: Activity): ViewGroup {
          return DevMenuApi.createFragmentHost(activity, reactHostHolder)
        }

        override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
          val fragment = fragment ?: return false
          return fragment.onKeyUp(keyCode, event)
        }
      }
    )
  }
}
