package expo.modules.devmenu

import android.app.Application
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactApplicationContext

class DevMenuAppInstance(reactContext: ReactApplicationContext) {
  val instanceManager: ReactInstanceManager

  init {
    instanceManager = createInstanceManager(reactContext)
  }

  fun createInstanceManager(reactContext: ReactApplicationContext): ReactInstanceManager {
    val builder = ReactInstanceManager.builder()
      .setApplication(reactContext as Application)
      .addPackage(DevMenuPackage())
      .setJSMainModulePath("index")
      .setUseDeveloperSupport(false)

    return builder.build()
  }
}