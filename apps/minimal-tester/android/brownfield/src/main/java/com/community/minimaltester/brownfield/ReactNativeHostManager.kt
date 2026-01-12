package com.community.minimaltester.brownfield

import android.app.Activity
import android.app.Application
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import com.facebook.react.PackageList
import com.facebook.react.ReactHost
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

  fun initialize(application: Application) {
    if (reactHost != null) {
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

    reactHost = ExpoReactHostFactory.getDefaultReactHost(
      context = application.applicationContext,
      packageList = PackageList(application).packages
    )
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
