package expo.modules.devlauncher.launcher

import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.interfaces.devmenu.DevMenuManagerProviderInterface
import expo.modules.devlauncher.DevLauncherController

class DevLauncherActivity : ReactActivity(), ReactInstanceManager.ReactInstanceEventListener {
  private var devMenuManager: DevMenuManagerInterface? = null

  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {

      override fun getReactNativeHost() = DevLauncherController.instance.devClientHost

      override fun getLaunchOptions() = Bundle().apply {
        putBoolean("isSimulator", isSimulator)
      }
    }
  }

  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)

    reactInstanceManager.currentReactContext?.let {
      onReactContextInitialized(it)
      return
    }

    reactInstanceManager.addReactInstanceEventListener(this)
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    devMenuManager?.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return devMenuManager?.onKeyEvent(keyCode, event) == true || super.onKeyUp(keyCode, event)
  }

  override fun onReactContextInitialized(context: ReactContext) {
    reactInstanceManager.removeReactInstanceEventListener(this)
    setUpDevMenuDelegateIfPresent(context)
  }

  private fun setUpDevMenuDelegateIfPresent(context: ReactContext) {
    DevLauncherController.instance.maybeInitDevMenuDelegate(context)

    val devMenuManagerProvider = context
      .catalystInstance
      .nativeModules
      .find { nativeModule ->
        nativeModule is DevMenuManagerProviderInterface
      } as? DevMenuManagerProviderInterface

    this.devMenuManager = devMenuManagerProvider?.getDevMenuManager()
  }

  private val isSimulator
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")
}
