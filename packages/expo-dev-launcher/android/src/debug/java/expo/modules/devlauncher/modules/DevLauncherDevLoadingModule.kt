package expo.modules.devlauncher.modules

import com.facebook.fbreact.specs.NativeDevLoadingViewSpec
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.devsupport.DefaultDevLoadingViewImplementation
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.devloading.DevLoadingModule
import expo.modules.devlauncher.rncompatibility.DevLauncherDevSupportManager


// Based on https://github.com/facebook/react-native/blob/0.72-stable/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/devloading/DevLoadingModule.java
@ReactModule(name = NativeDevLoadingViewSpec.NAME)
class DevLauncherDevLoadingModule(reactContext: ReactApplicationContext) : DevLoadingModule(reactContext) {
  private val mJSExceptionHandler: JSExceptionHandler?
  private var mDevLoadingViewManager: DevLoadingViewManager? = null

  init {
    mJSExceptionHandler = reactContext.jsExceptionHandler
    if (mJSExceptionHandler != null && mJSExceptionHandler is DevLauncherDevSupportManager) {
      mDevLoadingViewManager = DefaultDevLoadingViewImplementation((mJSExceptionHandler as DevLauncherDevSupportManager).reactInstanceManagerHelper)
    }
  }
}
