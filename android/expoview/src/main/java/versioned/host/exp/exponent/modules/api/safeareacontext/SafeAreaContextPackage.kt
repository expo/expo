package versioned.host.exp.exponent.modules.api.safeareacontext
import host.exp.expoview.BuildConfig

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.soloader.SoLoader

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
              TurboModule::class.java.isAssignableFrom(moduleClass))
    }
    return ReactModuleInfoProvider { reactModuleInfoMap }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // For Fabric, we load c++ native library here, this triggers screen's Fabric
      // component registration which is necessary in order to avoid asking users
      // to manually add init calls in their application code.
      // This should no longer be needed if RN's autolink mechanism has Fabric support
      SoLoader.loadLibrary("safeareacontext_modules")
    }
    return listOf<ViewManager<*, *>>(SafeAreaProviderManager(), SafeAreaViewManager())
  }
}
