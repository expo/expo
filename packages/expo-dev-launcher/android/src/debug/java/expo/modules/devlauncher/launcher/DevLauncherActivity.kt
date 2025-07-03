package expo.modules.devlauncher.launcher

import android.os.Bundle
import android.os.Handler
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.koin.DevLauncherKoinComponent
import expo.modules.devlauncher.splashscreen.DevLauncherSplashScreen
import expo.modules.devlauncher.splashscreen.DevLauncherSplashScreenProvider
import expo.modules.devmenu.DevMenuManager
import org.koin.core.component.inject

const val SEARCH_FOR_ROOT_VIEW_INTERVAL = 20L

class DevLauncherActivity : ReactActivity(), ReactInstanceEventListener, DevLauncherKoinComponent {
  private val controller: DevLauncherControllerInterface by inject()
  private var devMenuManager: DevMenuManager = DevMenuManager
  private var splashScreen: DevLauncherSplashScreen? = null
  private var rootView: ViewGroup? = null
  private lateinit var contentView: ViewGroup
  private val handler = Handler()

  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {

      override fun getReactNativeHost() = controller.devClientHost.reactNativeHost

      override fun getReactHost() = controller.devClientHost.reactHost

      override fun getLaunchOptions() = Bundle().apply {
        putBoolean("isSimulator", isSimulator)
      }
    }
  }

  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Enables edge-to-edge
    WindowCompat.setDecorFitsSystemWindows(window, false)
    super.onCreate(savedInstanceState)

    contentView = findViewById(android.R.id.content) ?: return
    splashScreen = DevLauncherSplashScreenProvider()
      .attachSplashScreenViewAsync(this)
    searchForRootView()
  }

  override fun onPostCreate(savedInstanceState: Bundle?) {
    super.onPostCreate(savedInstanceState)
    controller.devClientHost.currentReactContext?.let {
      onReactContextInitialized(it)
      return
    }

    controller.devClientHost.addReactInstanceEventListener(this)
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }

  override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
    devMenuManager.onTouchEvent(ev)
    return super.dispatchTouchEvent(ev)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    return devMenuManager.onKeyEvent(keyCode, event) || super.onKeyUp(keyCode, event)
  }

  override fun onReactContextInitialized(context: ReactContext) {
    controller.devClientHost.removeReactInstanceEventListener(this)
  }

  private val isSimulator
    get() = EmulatorUtilities.isRunningOnEmulator()

  private fun searchForRootView() {
    if (rootView != null) {
      return
    }
    // RootView is successfully found in first check (nearly impossible for first call)
    findRootView(contentView)?.let { return@searchForRootView handleRootView(it) }
    handler.postDelayed({ searchForRootView() }, SEARCH_FOR_ROOT_VIEW_INTERVAL)
  }

  private fun findRootView(view: View): ViewGroup? {
    if (view is ReactRootView) {
      return view
    }
    if (view != splashScreen && view is ViewGroup) {
      for (idx in 0 until view.childCount) {
        findRootView(view.getChildAt(idx))?.let { return@findRootView it }
      }
    }
    return null
  }

  private fun handleRootView(view: ViewGroup) {
    rootView = view
    if ((rootView?.childCount ?: 0) > 0) {
      hideSplashScreen()
    }

    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: View, child: View) = Unit
      override fun onChildViewAdded(parent: View, child: View) {
        // react only to first child
        if (rootView?.childCount == 1) {
          hideSplashScreen()
        }
      }
    })
  }

  private fun hideSplashScreen() {
    splashScreen?.let {
      runOnUiThread {
        contentView.removeView(it)
        splashScreen = null
      }
    }
  }
}
