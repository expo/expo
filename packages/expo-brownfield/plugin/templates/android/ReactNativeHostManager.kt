package ${{packageId}}

import android.app.Activity
import android.app.Application
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import com.facebook.react.PackageList
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.ExpoReactHostFactory
import expo.modules.brownfield.BrownfieldNavigationState

class ReactNativeHostManager {
  companion object {
    val shared: ReactNativeHostManager by lazy { ReactNativeHostManager() }
    private var reactHost: ReactHost? = null
  }

  fun getReactHost(): ReactHost? {
    return reactHost
  }

  /**
   * @param useDevSupport Whether to load JavaScript from a Metro dev server. Defaults to the
   *   build type, so debug builds use Metro and release builds use the embedded bundle. Pass
   *   `false` in a debug build to run against the bundle embedded in the AAR instead — that
   *   bundle only exists if the `android.bundleInDebug` config plugin option is enabled.
   */
  fun initialize(
    application: Application,
    additionalPackages: List<ReactPackage> = emptyList(),
    useDevSupport: Boolean = BuildConfig.DEBUG,
  ) {
    if (reactHost != null) {
      return
    }

    // Without dev support there is no Metro to fetch from, so the bundle has to be embedded in
    // the assets. That covers release builds and debug builds that opted out of dev support.
    if (!useDevSupport) {
      val assets = application.applicationContext.assets.list("")?.toList()
        ?: emptyList<String>()
      if (!assets.contains("index.android.bundle")) {
        val bundleList = assets
          .filter { it.endsWith(".bundle") }
          .map { "- $it" }.joinToString("\n")
          ?: "None"

          throw IllegalStateException("""
          Cannot find `index.android.bundle` in the assets.
          React Native was started without dev support, so it loads JavaScript from the
          bundle embedded in the AAR, but no bundle was packaged.
          In a debug build, enable the `android.bundleInDebug` option on the expo-brownfield
          config plugin and rebuild. Otherwise pass `useDevSupport = true` to run against Metro.
          Available JS bundles:
          $bundleList
          """.trimIndent()
        )
      }
    }

    DefaultNewArchitectureEntryPoint.releaseLevel =
        try {
          ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
        } catch (e: IllegalArgumentException) {
          ReleaseLevel.STABLE
        }
    loadReactNative(application)
    BrownfieldLifecycleDispatcher.onApplicationCreate(application)

    // Pass `useDevSupport` explicitly (default is `ReactBuildConfig.DEBUG`). The
    // brownfield's own `BuildConfig.DEBUG` follows the fused sibling's variant
    // (true in `-fused-debug`, false in `-fused-release`) — defaulting the parameter
    // to it ensures dev support fires correctly regardless of which RN variant the
    // consumer resolves, while still letting the host opt out.
    reactHost = ExpoReactHostFactory.getDefaultReactHost(
      context = application.applicationContext,
      packageList = PackageList(application).packages + additionalPackages,
      useDevSupport = useDevSupport
    )
  }
}

fun Activity.showReactNativeFragment(rootComponent: String = "main", additionalPackages: List<ReactPackage> = emptyList(), useDevSupport: Boolean = BuildConfig.DEBUG) {
  ReactNativeHostManager.shared.initialize(this.application, additionalPackages, useDevSupport)
  val fragment = ReactNativeFragment.createFragmentHost(this, rootComponent)
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
