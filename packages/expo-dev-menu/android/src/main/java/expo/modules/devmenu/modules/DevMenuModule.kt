package expo.modules.devmenu.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.launch

class DevMenuModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
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
    devMenuManager.coroutineScope.launch {
      try {
        devMenuManager
          .getExpoApiClient()
          .queryMyProjects()
          .use {
            @Suppress("DEPRECATION_ERROR")
            promise.resolve(it.body()?.charStream()?.readText() ?: "")
          }
      } catch (e: Exception) {
        promise.reject("ERR_DEVMENU_CANNOT_GET_PROJECTS", e.message, e)
      }
    }
  }

  @ReactMethod
  fun queryDevSessionsAsync(promise: Promise) {
    devMenuManager.coroutineScope.launch {
      try {
        devMenuManager
          .getExpoApiClient()
          .queryDevSessions()
          .use {
            @Suppress("DEPRECATION_ERROR")
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
