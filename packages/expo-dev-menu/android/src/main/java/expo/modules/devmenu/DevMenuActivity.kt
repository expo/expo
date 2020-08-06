package expo.modules.devmenu

import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView
import expo.modules.devmenu.managers.DevMenuManager
import java.util.*


class DevMenuActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    DevMenuManager.getDevMenuLifecycleHandler().devMenuHasBeenOpened(this)
  }

  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost(): ReactNativeHost {
        return DevMenuManager.getDevMenuHost()
      }

      override fun getLaunchOptions(): Bundle? {
        val bundle = Bundle()
        bundle.putBoolean("enableDevelopmentTools", true)
        bundle.putBoolean("showOnboardingView", false)
        bundle.putParcelableArray("devMenuItems", DevMenuManager.serializedDevMenuItems().toTypedArray())
        bundle.putString("uuid", UUID.randomUUID().toString())
        bundle.putBundle("appInfo", DevMenuManager.getSession()?.appInfo ?: Bundle.EMPTY)
        return bundle
      }

      override fun createRootView() = RNGestureHandlerEnabledRootView(this@DevMenuActivity)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    DevMenuManager.getDevMenuLifecycleHandler().devMenuHasBeenDestroyed()
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    when (keyCode) {
      KeyEvent.KEYCODE_T -> {
        DevMenuManager.closeMenu()
        return true
      }
    }
    return super.onKeyDown(keyCode, event)
  }

  override fun onPause() {
    super.onPause()
    overridePendingTransition(0, 0)
  }
}
