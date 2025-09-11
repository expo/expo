package expo.modules

import android.app.Application
import android.content.Context
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.interfaces.RedBoxHandler

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

  override fun getReactPackageTurboModuleManagerDelegateBuilder(): ReactPackageTurboModuleManagerDelegate.Builder? {
    return invokeDelegateMethod("getReactPackageTurboModuleManagerDelegateBuilder")
  }

  override fun getUIManagerProvider(): UIManagerProvider? {
    return invokeDelegateMethod("getUIManagerProvider")
  }

  override fun getShouldRequireActivity(): Boolean {
    return host.shouldRequireActivity
  }

  override fun getSurfaceDelegateFactory(): SurfaceDelegateFactory {
    return host.surfaceDelegateFactory
  }

  override fun getRedBoxHandler(): RedBoxHandler? {
    return invokeDelegateMethod("getRedBoxHandler")
  }

  companion object {
    @JvmStatic
    fun createReactHost(context: Context, reactNativeHost: ReactNativeHost): ReactHost {
      return ExpoReactHostFactory.createFromReactNativeHost(context, reactNativeHost)
    }
  }
}
