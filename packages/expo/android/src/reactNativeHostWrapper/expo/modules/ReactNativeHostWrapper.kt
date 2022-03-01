package expo.modules

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.devsupport.DevSupportManagerFactory

class ReactNativeHostWrapper(
  application: Application,
  host: ReactNativeHost
) : ReactNativeHostWrapperBase(application, host) {
  override fun getDevSupportManagerFactory(): DevSupportManagerFactory? {
    return reactNativeHostHandlers
      .asSequence()
      .mapNotNull { it.devSupportManagerFactory }
      .firstOrNull() as DevSupportManagerFactory?
      ?: invokeDelegateMethod("getDevSupportManagerFactory")
  }
}
