// Copyright 2020-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent

import com.facebook.react.CoreModulesPackage
import com.facebook.react.ReactRootView
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END
import com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.intent.IntentModule
import com.facebook.react.modules.storage.AsyncStorageModule
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.react.uimanager.ReanimatedUIManager
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.systrace.Systrace
import expo.modules.manifests.core.Manifest
import host.exp.exponent.di.NativeModuleDepsProvider
import host.exp.exponent.kernel.Kernel
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.KernelConstants
import host.exp.expoview.Exponent
import versioned.host.exp.exponent.modules.api.reanimated.ReanimatedModule
import versioned.host.exp.exponent.modules.internal.ExponentAsyncStorageModule
import versioned.host.exp.exponent.modules.internal.ExponentIntentModule
import versioned.host.exp.exponent.modules.internal.ExponentUnsignedAsyncStorageModule
import javax.inject.Inject

/** Package defining basic modules and view managers.  */
@ReactModuleList(
  nativeModules = [
    // TODO(Bacon): Do we need to support unsigned storage module here?
    ExponentAsyncStorageModule::class,
    ExponentIntentModule::class,
    ReanimatedModule::class,
    ReanimatedUIManager::class,
  ]
)
class ExpoTurboPackage(
  private val experienceProperties: Map<String, Any?>,
  private val manifest: Manifest
) : TurboReactPackage() {
  @Inject
  internal lateinit var kernel: Kernel

  init {
    NativeModuleDepsProvider.instance.inject(ExpoTurboPackage::class.java, this)
  }

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
      ReanimatedModule.NAME -> ReanimatedModule(context)
      ReanimatedUIManager.NAME -> createReanimatedUIManager(context) ?: getDefaultUIManager(context)
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
        ExponentIntentModule::class.java,
        ReanimatedModule::class.java,
        ReanimatedUIManager::class.java,
      )
      val reactModuleInfoMap = mutableMapOf<String, ReactModuleInfo>()
      for (moduleClass in moduleList) {
        val reactModule = moduleClass.getAnnotation(ReactModule::class.java)!!
        val isTurbo = TurboModule::class.java.isAssignableFrom(moduleClass)
        reactModuleInfoMap[reactModule.name] = ReactModuleInfo(
          reactModule.name,
          moduleClass.name,
          if (reactModule.name == ReanimatedUIManager.NAME) true else reactModule.canOverrideExistingModule,
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

  private fun createReanimatedUIManager(reactContext: ReactApplicationContext): UIManagerModule? {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return null
    val reactInstanceManager = (currentActivity.rootView as? ReactRootView)?.reactInstanceManager
      ?: return null

    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START)
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule")
    val minTimeLeftInFrameForNonBatchedOperationMs = -1
    return try {
      ReanimatedUIManager(
        reactContext,
        reactInstanceManager.getOrCreateViewManagers(reactContext),
        minTimeLeftInFrameForNonBatchedOperationMs
      )
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END)
    }
  }

  /**
   * fallback path to get the react native default UIManagerModule
   */
  private fun getDefaultUIManager(context: ReactApplicationContext): UIManagerModule {
    val reactInstanceManager = kernel.reactInstanceManager
      ?: throw RuntimeException("Cannot get ReactInstanceManager from kernel")
    val coreModulesPackage = reactInstanceManager.packages.first { it is CoreModulesPackage } as? CoreModulesPackage
      ?: throw RuntimeException("Cannot get CoreModulesPackage")
    return coreModulesPackage.getModule(UIManagerModule.NAME, context) as UIManagerModule
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
