package expo.modules.devmenu

import android.content.Context
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.ViewGroup
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.helpers.getPrivateDeclaredFieldValue
import expo.modules.devmenu.helpers.setPrivateDeclaredFieldValue
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
      // We don't want to destroy the root view, because we want to reuse it later.
      override fun onDestroy() = Unit

      override fun loadApp(appKey: String?) {
        // On the first launch of this activity we need to call super.loadApp() to start the dev menu
        if (!appWasLoaded) {
          super.loadApp(appKey)
          appWasLoaded = true
          return
        }

        val reactDelegate: ReactDelegate = ReactActivityDelegate::class.java
          .getPrivateDeclaredFieldValue("mReactDelegate", this)

        ReactDelegate::class.java
          .setPrivateDeclaredFieldValue("mReactRootView", reactDelegate, rootView)

        // Removes the root view from the previous activity
        (rootView.parent as? ViewGroup)?.removeView(rootView)

        // Attaches the root view to the current activity
        plainActivity.setContentView(reactDelegate.reactRootView)

        // Sets up new app properties
        runOnUiThread {
          rootView.appProperties = launchOptions
        }
      }

      override fun getReactNativeHost() = DevMenuManager.getMenuHost()

      override fun getLaunchOptions() = Bundle().apply {
        putBoolean("enableDevelopmentTools", true)
        putBoolean("showOnboardingView", DevMenuManager.getSettings()?.isOnboardingFinished != true)
        putParcelableArray("devMenuItems", DevMenuManager.serializedItems().toTypedArray())
        putParcelableArray("devMenuScreens", DevMenuManager.serializedScreens().toTypedArray())
        putString("uuid", UUID.randomUUID().toString())
        putBundle("appInfo", DevMenuManager.getSession()?.appInfo ?: Bundle.EMPTY)
        putString("openScreen", DevMenuManager.getSession()?.openScreen)
      }

      override fun createRootView() = createRootView(this@DevMenuActivity)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Due to a bug in API 26, we can't set the orientation in translucent activity.
    // See https://stackoverflow.com/questions/48072438/java-lang-illegalstateexception-only-fullscreen-opaque-activities-can-request-o
    requestedOrientation = if (Build.VERSION.SDK_INT == Build.VERSION_CODES.O) {
      ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    } else {
      ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }

    super.onCreate(savedInstanceState)
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

  override fun onStart() {
    super.onStart()
    val instanceManager = DevMenuManager.delegate?.reactInstanceManager() ?: return
    val supportsDevelopment = DevMenuManager.delegate?.supportsDevelopment() ?: false

    if (supportsDevelopment) {
      val devSupportManager: DevSupportManager =
        ReactInstanceManager::class.java.getPrivateDeclaredFieldValue(
          "mDevSupportManager", instanceManager
        )

      devSupportManager.devSupportEnabled = true
    }
  }

  companion object {
    var appWasLoaded = false
    private lateinit var rootView: ReactRootView

    fun createRootView(activity: ReactActivity): ReactRootView {
      if (::rootView.isInitialized) {
        return rootView
      }

      // This type hint is needed for the older kotlin version.
      @Suppress("RemoveExplicitTypeArguments")
      rootView = getVendoredClass<ReactRootView>(
        "com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView",
        arrayOf(Context::class.java),
        arrayOf(activity)
      )
      return rootView
    }
  }
}
