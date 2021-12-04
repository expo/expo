// Copyright 2020-present 650 Industries. All rights reserved.
package abi44_0_0.host.exp.exponent

import abi44_0_0.com.facebook.react.TurboReactPackage
import abi44_0_0.com.facebook.react.bridge.NativeModule
import abi44_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi44_0_0.com.facebook.react.module.annotations.ReactModule
import abi44_0_0.com.facebook.react.module.annotations.ReactModuleList
import abi44_0_0.com.facebook.react.module.model.ReactModuleInfo
import abi44_0_0.com.facebook.react.module.model.ReactModuleInfoProvider
import abi44_0_0.com.facebook.react.modules.intent.IntentModule
import abi44_0_0.com.facebook.react.modules.storage.AsyncStorageModule
import abi44_0_0.com.facebook.react.turbomodule.core.interfaces.TurboModule
import abi44_0_0.com.facebook.react.uimanager.ViewManager
import expo.modules.manifests.core.Manifest
import host.exp.exponent.kernel.KernelConstants
import abi44_0_0.host.exp.exponent.modules.internal.ExponentAsyncStorageModule
import abi44_0_0.host.exp.exponent.modules.internal.ExponentIntentModule
import abi44_0_0.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule

/** Package defining basic modules and view managers.  */
@ReactModuleList(
  nativeModules = [
    // TODO(Bacon): Do we need to support unsigned storage module here?
    ExponentAsyncStorageModule::class,
    ExponentIntentModule::class
  ]
)
class ExpoTurboPackage(
  private val experienceProperties: Map<String, Any?>,
  private val manifest: Manifest
) : TurboReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf()
  }

  override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
    val isVerified = manifest.isVerified()
    return when (name) {
      AsyncStorageModule.NAME -> if (isVerified) {
        ExponentAsyncStorageModule(context, manifest)
      } else {
        ExponentUnsignedAsyncStorageModule(context)
      }
      IntentModule.NAME -> ExponentIntentModule(
        context,
        experienceProperties
      )
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return try {
      // TODO(Bacon): Does this need to reflect ExpoTurboPackage$$ReactModuleInfoProvider ?
      val reactModuleInfoProviderClass = Class.forName("com.facebook.react.shell.MainReactPackage$\$ReactModuleInfoProvider")
      reactModuleInfoProviderClass.newInstance() as ReactModuleInfoProvider
    } catch (e: ClassNotFoundException) {
      // In OSS case, the annotation processor does not run. We fall back on creating this by hand
      val moduleList: Array<Class<out NativeModule?>> = arrayOf(
        // TODO(Bacon): Do we need to support unsigned storage module here?
        ExponentAsyncStorageModule::class.java,
        ExponentIntentModule::class.java
      )
      val reactModuleInfoMap = mutableMapOf<String, ReactModuleInfo>()
      for (moduleClass in moduleList) {
        val reactModule = moduleClass.getAnnotation(ReactModule::class.java)!!
        val isTurbo = TurboModule::class.java.isAssignableFrom(moduleClass)
        reactModuleInfoMap[reactModule.name] = ReactModuleInfo(
          reactModule.name,
          moduleClass.name,
          reactModule.canOverrideExistingModule,
          reactModule.needsEagerInit,
          reactModule.hasConstants,
          reactModule.isCxxModule,
          isTurbo
        )
      }
      ReactModuleInfoProvider { reactModuleInfoMap }
    } catch (e: InstantiationException) {
      throw RuntimeException(
        "No ReactModuleInfoProvider for CoreModulesPackage$\$ReactModuleInfoProvider", e
      )
    } catch (e: IllegalAccessException) {
      throw RuntimeException(
        "No ReactModuleInfoProvider for CoreModulesPackage$\$ReactModuleInfoProvider", e
      )
    }
  }

  companion object {
    private val TAG = ExpoTurboPackage::class.java.simpleName

    fun kernelExpoTurboPackage(manifest: Manifest, initialURL: String?): ExpoTurboPackage {
      val kernelExperienceProperties = mutableMapOf(
        KernelConstants.LINKING_URI_KEY to "exp://",
        KernelConstants.IS_HEADLESS_KEY to false,
      ).apply {
        if (initialURL != null) {
          this[KernelConstants.INTENT_URI_KEY] = initialURL
        }
      }
      return ExpoTurboPackage(kernelExperienceProperties, manifest)
    }
  }
}
