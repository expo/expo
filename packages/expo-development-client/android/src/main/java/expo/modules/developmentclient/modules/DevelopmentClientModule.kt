package expo.modules.developmentclient.modules

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import expo.modules.developmentclient.DevelopmentClientController.Companion.instance
import kotlinx.coroutines.runBlocking
import java.lang.Exception

class DevelopmentClientModule(reactContext: ReactApplicationContext?) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String {
    return "EXDevelopmentClient"
  }

  @ReactMethod
  fun loadApp(url: String, promise: Promise) {
    runBlocking {
      try {
        instance.loadApp(url)
      } catch (e: Exception) {
        promise.reject(e)
      }
      promise.resolve(null)
    }
  }

  override fun hasConstants(): Boolean {
    return true
  }
}
