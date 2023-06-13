package expo.modules

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.devsupport.RedBoxHandler

class ReactNativeHostWrapper(
  application: Application,
  host: ReactNativeHost
) : ReactNativeHostWrapperBase(application, host) {
  override fun getRedBoxHandler(): RedBoxHandler? {
    return invokeDelegateMethod("getRedBoxHandler")
  }

  @Suppress("DEPRECATION")
  override fun getUIImplementationProvider(): com.facebook.react.uimanager.UIImplementationProvider {
    return invokeDelegateMethod("getUIImplementationProvider")
  }
}
