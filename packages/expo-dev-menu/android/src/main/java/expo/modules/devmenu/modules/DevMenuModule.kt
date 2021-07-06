package expo.modules.devmenu.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class DevMenuModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {
  override fun getName() = "ExpoDevMenu"

  private val devMenuManager by lazy {
    reactContext
      .getNativeModule(DevMenuManagerProvider::class.java)!!
      .getDevMenuManager()
  }

  private fun openMenuOn(screen: String?) {
    reactApplicationContext
      .currentActivity
      ?.run {
        devMenuManager.openMenu(this, screen)
      }
  }

  @ReactMethod
  fun isLoggedInAsync(promise: Promise) {
    promise.resolve(
      devMenuManager
        .getExpoApiClient()
        .isLoggedIn()
    )
  }

  @ReactMethod
  fun queryMyProjectsAsync(promise: Promise) {
    GlobalScope.launch {
      try {
        devMenuManager
          .getExpoApiClient()
          .queryMyProjects()
          .use {
            promise.resolve(it.body()?.charStream()?.readText() ?: "")
          }
      } catch (e: Exception) {
        promise.reject("ERR_DEVMENU_CANNOT_GET_PROJECTS", e.message, e)
      }
    }
  }

  @ReactMethod
  fun queryDevSessionsAsync(promise: Promise) {
    GlobalScope.launch {
      try {
        devMenuManager
          .getExpoApiClient()
          .queryDevSessions()
          .use {
            promise.resolve(it.body()?.charStream()?.readText() ?: "")
          }
      } catch (e: Exception) {
        promise.reject("ERR_DEVMENU_CANNOT_GET_DEV_SESSIONS", e.message, e)
      }
    }
  }

  @ReactMethod
  fun openMenu() {
    openMenuOn(null)
  }

  @ReactMethod
  fun openProfile() {
    openMenuOn("Profile")
  }

  @ReactMethod
  fun openSettings() {
    openMenuOn("Settings")
  }
}
