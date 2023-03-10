// Copyright 2020-present 650 Industries. All rights reserved.
package abi48_0_0.host.exp.exponent

import abi48_0_0.com.facebook.react.ReactInstanceManager
import abi48_0_0.com.facebook.react.ReactRootView
import abi48_0_0.com.facebook.react.TurboReactPackage
import abi48_0_0.com.facebook.react.bridge.NativeModule
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi48_0_0.com.facebook.react.bridge.ReactMarker
import abi48_0_0.com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END
import abi48_0_0.com.facebook.react.bridge.ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START
import abi48_0_0.com.facebook.react.module.annotations.ReactModule
import abi48_0_0.com.facebook.react.module.annotations.ReactModuleList
import abi48_0_0.com.facebook.react.module.model.ReactModuleInfo
import abi48_0_0.com.facebook.react.module.model.ReactModuleInfoProvider
import abi48_0_0.com.facebook.react.modules.intent.IntentModule
import abi48_0_0.com.facebook.react.turbomodule.core.interfaces.TurboModule
import abi48_0_0.com.facebook.react.uimanager.ReanimatedUIManager
import abi48_0_0.com.swmansion.reanimated.ReanimatedUIManagerFactory
import abi48_0_0.com.facebook.react.uimanager.UIManagerModule
import abi48_0_0.com.facebook.react.uimanager.ViewManager
import abi48_0_0.com.facebook.systrace.Systrace
import abi48_0_0.com.swmansion.reanimated.ReanimatedModule
import expo.modules.manifests.core.Manifest
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.KernelConstants
import host.exp.expoview.Exponent
import abi48_0_0.host.exp.exponent.modules.internal.ExponentIntentModule

/** Package defining basic modules and view managers.  */
@ReactModuleList(
  nativeModules = [
    ExponentIntentModule::class,
    ReanimatedModule::class,
    ReanimatedUIManager::class,
  ]
)
class ExpoTurboPackage(
  private val experienceProperties: Map<String, Any?>,
  private val manifest: Manifest
) : TurboReactPackage() {
  // Get the hosted `ReactInstanceManager` by current Activity
  private val reactInstanceManager: ReactInstanceManager?
    get() {
      val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return null
      return (currentActivity.rootView as? ReactRootView)?.reactInstanceManager
    }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf()
  }

  override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
    val isVerified = manifest.isVerified()
    return when (name) {
      IntentModule.NAME -> ExponentIntentModule(
        context,
        experienceProperties
      )
      ReanimatedModule.NAME -> ReanimatedModule(context)
      ReanimatedUIManager.NAME -> createReanimatedUIManager(context) ?: throw RuntimeException("Cannot create reanimated uimanager")
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
        ExponentIntentModule::class.java,
        ReanimatedModule::class.java,
        ReanimatedUIManager::class.java,
      )
      val reactModuleInfoMap = mutableMapOf<String, ReactModuleInfo>()
      for (moduleClass in moduleList) {
        val reactModule = moduleClass.getAnnotation(ReactModule::class.java)!!
        var canOverrideExistingModule = reactModule.canOverrideExistingModule
        val isTurbo = TurboModule::class.java.isAssignableFrom(moduleClass)
        if (reactModule.name == ReanimatedUIManager.NAME) {
          if (!shouldOverrideUIManagerForReanimated()) {
            continue
          }
          canOverrideExistingModule = true
        }
        reactModuleInfoMap[reactModule.name] = ReactModuleInfo(
          reactModule.name,
          moduleClass.name,
          canOverrideExistingModule,
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
    val reactInstanceManager = this.reactInstanceManager ?: return null
    ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_START)
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "createUIManagerModule")
    val minTimeLeftInFrameForNonBatchedOperationMs = -1
    return try {
      ReanimatedUIManagerFactory.create(
        reactContext,
        reactInstanceManager.getOrCreateViewManagers(reactContext),
        minTimeLeftInFrameForNonBatchedOperationMs
      )
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
      ReactMarker.logMarker(CREATE_UI_MANAGER_MODULE_END)
    }
  }

  // Reanimated UIManager requires `ReactInstanceManager`,
  // for headless mode we cannot get the hosted `ReactInstanceManager` from current Activity,
  // in this case, we don't override UIManager for reanimated.
  // besides, we should not override in remote debugging mode because reanimated does not support it.
  private fun shouldOverrideUIManagerForReanimated(): Boolean {
    this.reactInstanceManager?.run {
      return !(devSupportManager.devSettings?.isRemoteJSDebugEnabled ?: false)
    }

    return false
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
