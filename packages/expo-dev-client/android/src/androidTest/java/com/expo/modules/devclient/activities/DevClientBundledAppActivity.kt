package com.expo.modules.devclient.activities

import android.content.Intent
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import expo.modules.devlauncher.DevLauncherController.Companion.tryToHandleIntent
import expo.modules.devlauncher.DevLauncherController.Companion.wrapReactActivityDelegate
import expo.modules.devlauncher.launcher.DevLauncherReactActivityDelegateSupplier
import expo.modules.devmenu.react.DevMenuAwareReactActivity

internal var reactApplicationHolder: ReactApplication? = null

internal class DevClientBundledAppActivity : DevMenuAwareReactActivity() {
  override fun getMainComponentName(): String {
    return "main"
  }

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    val activity = this
    return wrapReactActivityDelegate(
      this,
      object : DevLauncherReactActivityDelegateSupplier {
        override fun get(): ReactActivityDelegate {
          return object : ReactActivityDelegate(activity, mainComponentName) {
            override fun getReactNativeHost(): ReactNativeHost {
              return reactApplicationHolder!!.reactNativeHost
            }

            override fun getReactHost(): ReactHost {
              return requireNotNull(reactApplicationHolder!!.reactHost)
            }
          }
        }
      }
    )
  }

  override fun onNewIntent(intent: Intent?) {
    if (tryToHandleIntent(this, intent!!)) {
      return
    }

    super.onNewIntent(intent)
  }
}
