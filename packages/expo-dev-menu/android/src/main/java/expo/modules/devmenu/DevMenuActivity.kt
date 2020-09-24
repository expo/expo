package expo.modules.devmenu

import android.content.Context
import android.os.Bundle
import android.view.KeyEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactRootView
import java.util.*

/**
 * The dev menu is launched using this activity.
 * [DevMenuActivity] is transparent and doesn't have any in/out animations.
 * So we can display dev menu as a modal.
 */
class DevMenuActivity : ReactActivity() {
  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost() = DevMenuManager.getMenuHost()

      override fun getLaunchOptions() = Bundle().apply {
        putBoolean("enableDevelopmentTools", true)
        putBoolean("showOnboardingView", DevMenuManager.getSettings()?.isOnboardingFinished != true)
        putParcelableArray("devMenuItems", DevMenuManager.serializedItems().toTypedArray())
        putString("uuid", UUID.randomUUID().toString())
        putBundle("appInfo", DevMenuManager.getSession()?.appInfo ?: Bundle.EMPTY)
      }

      override fun createRootView() = getVendoredClass<ReactRootView>("com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView", arrayOf(Context::class.java), arrayOf(this@DevMenuActivity))
    }
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return if (keyCode == KeyEvent.KEYCODE_MENU || DevMenuManager.onKeyEvent(keyCode, event)) {
      DevMenuManager.closeMenu()
      true
    } else {
      super.onKeyUp(keyCode, event)
    }
  }

  override fun onPause() {
    super.onPause()
    overridePendingTransition(0, 0)
  }
}
