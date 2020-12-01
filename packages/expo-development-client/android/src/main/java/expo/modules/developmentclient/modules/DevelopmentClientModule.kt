package expo.modules.developmentclient.modules

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import expo.modules.developmentclient.DevelopmentClientController.Companion.instance
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class DevelopmentClientModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "EXDevelopmentClient"
  }

  @ReactMethod
  fun loadApp(url: String, promise: Promise) {
    GlobalScope.launch {
      try {
        instance.loadApp(url)
      } catch (e: Exception) {
        promise.reject(e)
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getRecentlyOpenedApps(promise: Promise) {
    promise.resolve(Arguments
      .createMap()
      .apply {
        instance.getRecentlyOpenedApps().forEach { (key, value) ->
          putString(key, value)
        }
      })
  }

  override fun hasConstants(): Boolean {
    return true
  }
}
