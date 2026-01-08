package ${{packageId}}

import android.app.Activity
import android.app.Application
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.ReactNativeHostWrapper
import expo.modules.brownfield.BrownfieldNavigationState

class ReactNativeHostManager {
  companion object {
    val shared: ReactNativeHostManager by lazy { ReactNativeHostManager() }
    private var reactNativeHost: ReactNativeHost? = null
    private var reactHost: ReactHost? = null
  }

  fun getReactNativeHost(): ReactNativeHost? {
    return reactNativeHost
  }

  fun getReactHost(): ReactHost? {
    return reactHost
  }

  fun initialize(application: Application) {
    if (reactNativeHost != null && reactHost != null) {
      return
    }

    DefaultNewArchitectureEntryPoint.releaseLevel =
        try {
          ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
        } catch (e: IllegalArgumentException) {
          ReleaseLevel.STABLE
        }
    loadReactNative(application)
    BrownfieldLifecycleDispatcher.onApplicationCreate(application)

    val reactApp =
        object : ReactApplication {
          override val reactNativeHost: ReactNativeHost =
              ReactNativeHostWrapper(
                  application,
                  object : DefaultReactNativeHost(application) {
                    override fun getPackages(): List<ReactPackage> =
                        PackageList(this).packages.apply {}

                    override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

                    override fun getBundleAssetName(): String = "index.android.bundle"

                    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

                    override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
                  },
              )

          override val reactHost: ReactHost
            get() =
                ReactNativeHostWrapper.createReactHost(
                    application.getApplicationContext(),
                    reactNativeHost,
                )
        }

    reactNativeHost = reactApp.reactNativeHost
    reactHost = reactApp.reactHost
  }
}

fun Activity.showReactNativeFragment() {
  ReactNativeHostManager.shared.initialize(this.application)
  val fragment = ReactNativeFragment.createFragmentHost(this)
  setContentView(fragment)
  setUpNativeBackHandling()
}

fun Activity.setUpNativeBackHandling() {
  val componentActivity = this as? ComponentActivity
  if (componentActivity == null) {
    return
  }

  val backCallback =
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (BrownfieldNavigationState.nativeBackEnabled) {
            isEnabled = false
            componentActivity.onBackPressedDispatcher?.onBackPressed()
            isEnabled = true
          } else {
            val reactHost = ReactNativeHostManager.shared.getReactHost()
            reactHost?.currentReactContext?.let { reactContext ->
              val deviceEventManager =
                  reactContext.getNativeModule(DeviceEventManagerModule::class.java)
              deviceEventManager?.emitHardwareBackPressed()
            }
          }
        }
      }

  componentActivity.onBackPressedDispatcher?.addCallback(componentActivity, backCallback)
}
