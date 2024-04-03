package expo.modules

import android.app.Application
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
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

  override fun getJSEngineResolutionAlgorithm(): JSEngineResolutionAlgorithm? {
    return invokeDelegateMethod("getJSEngineResolutionAlgorithm")
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
}
