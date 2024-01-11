package expo.modules.devmenu

import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.view.doOnLayout
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.google.android.material.bottomsheet.BottomSheetBehavior
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

  private val isEmulator
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
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
          .setPrivateDeclaredFieldValue("mFabricEnabled", reactDelegate, fabricEnabled)
        ReactDelegate::class.java
          .setPrivateDeclaredFieldValue("mReactRootView", reactDelegate, rootView)

        // Removes the root view from the previous activity
        (rootView.parent as? ViewGroup)?.removeView(rootView)

        // Attaches the root view to the current activity
        plainActivity.setContentView(reactDelegate.getReactRootView())
      }

      override fun getReactNativeHost() = DevMenuManager.getMenuHost()

      override fun getLaunchOptions() = Bundle().apply {
        putString("uuid", UUID.randomUUID().toString())
        putBundle("appInfo", DevMenuManager.getAppInfo())
        putBundle("devSettings", DevMenuManager.getDevSettings())
        putBundle("menuPreferences", DevMenuManager.getMenuPreferences())
        putBoolean("isDevice", !isEmulator)
        putStringArray("registeredCallbacks", DevMenuManager.registeredCallbacks.map { it.name }.toTypedArray())
      }

      override fun createRootView(): ReactRootView {
        if (rootViewWasInitialized()) {
          return rootView
        }

        rootView = super.createRootView().apply { setIsFabric(fabricEnabled) }

        return rootView
      }

      override fun createRootView(bundle: Bundle?): ReactRootView {
        if (rootViewWasInitialized()) {
          return rootView
        }

        rootView = super.createRootView(bundle)

        return rootView
      }
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

  override fun onStart() {
    super.onStart()
    val instanceManager = DevMenuManager.delegate?.reactInstanceManager() ?: return
    val supportsDevelopment = DevMenuManager.delegate?.supportsDevelopment() ?: false

    if (supportsDevelopment) {
      val devSupportManager: DevSupportManager =
        ReactInstanceManager::class.java.getPrivateDeclaredFieldValue(
          "mDevSupportManager",
          instanceManager
        )

      devSupportManager.devSupportEnabled = true
    }
  }

  override fun setContentView(view: View?) {
    super.setContentView(R.layout.bottom_sheet)

    val mainLayout = findViewById<CoordinatorLayout>(R.id.main_layout)
    val bottomSheet = findViewById<FrameLayout>(R.id.bottom_sheet)
    bottomSheet.addView(view)

    BottomSheetBehavior.from(bottomSheet).apply {
      addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
        override fun onStateChanged(bottomSheet: View, newState: Int) {
          if (newState == BottomSheetBehavior.STATE_HIDDEN || newState == BottomSheetBehavior.STATE_COLLAPSED) {
            DevMenuManager.hideMenu()
          }
        }

        override fun onSlide(bottomSheet: View, slideOffset: Float) = Unit
      })

      bottomSheet.doOnLayout {
        state = BottomSheetBehavior.STATE_HALF_EXPANDED
      }

      mainLayout.setOnClickListener {
        state = BottomSheetBehavior.STATE_HIDDEN
      }
    }
  }

  fun closeBottomSheet() {
    val bottomSheet = findViewById<FrameLayout>(R.id.bottom_sheet)
    BottomSheetBehavior.from(bottomSheet).state = BottomSheetBehavior.STATE_HIDDEN
  }

  companion object {
    var appWasLoaded = false
    private lateinit var rootView: ReactRootView

    private fun rootViewWasInitialized() = ::rootView.isInitialized
  }
}
