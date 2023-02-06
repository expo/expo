package abi48_0_0.host.exp.exponent.modules.api.safeareacontext

import abi48_0_0.com.facebook.react.TurboReactPackage
import abi48_0_0.com.facebook.react.bridge.NativeModule
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi48_0_0.com.facebook.react.module.annotations.ReactModule
import abi48_0_0.com.facebook.react.module.model.ReactModuleInfo
import abi48_0_0.com.facebook.react.module.model.ReactModuleInfoProvider
import abi48_0_0.com.facebook.react.turbomodule.core.interfaces.TurboModule
import abi48_0_0.com.facebook.react.uimanager.ViewManager

// Fool autolinking for older versions that do not support TurboReactPackage.
// public class SafeAreaContextPackage implements ReactPackage {
class SafeAreaContextPackage : TurboReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      SafeAreaContextModule.NAME -> SafeAreaContextModule(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    val moduleList: Array<Class<out NativeModule?>> = arrayOf(SafeAreaContextModule::class.java)
    val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = HashMap()
    for (moduleClass in moduleList) {
      val reactModule = moduleClass.getAnnotation(ReactModule::class.java) ?: continue
      reactModuleInfoMap[reactModule.name] =
        ReactModuleInfo(
          reactModule.name,
          moduleClass.name,
          true,
          reactModule.needsEagerInit,
          reactModule.hasConstants,
          reactModule.isCxxModule,
          TurboModule::class.java.isAssignableFrom(moduleClass)
        )
    }
    return ReactModuleInfoProvider { reactModuleInfoMap }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf<ViewManager<*, *>>(SafeAreaProviderManager(), SafeAreaViewManager())
  }
}
