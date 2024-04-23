package expo.modules.devlauncher.launcher

import android.app.Application
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
import devmenu.com.th3rdwave.safeareacontext.SafeAreaProviderManager
import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.DevLauncherPackage
import expo.modules.devlauncher.helpers.findDevMenuPackage
import expo.modules.devlauncher.helpers.findPackagesWithDevMenuExtension
import expo.modules.devlauncher.helpers.injectDebugServerHost
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.kotlin.ModulesProvider

object DevLauncherReactHost {

  @OptIn(UnstableReactNativeAPI::class)
  fun create(application: Application, launcherIp: String?): ReactHost {
    val jsBundleAssetPath = "expo_dev_launcher_android.bundle"
    val jsBundleLoader =
      JSBundleLoader.createAssetLoader(application, "assets://$jsBundleAssetPath", true)
    val jsResolutionAlgorithm = createJSEngineResolutionAlgorithm(application)
    val jsRuntimeFactory = if (jsResolutionAlgorithm == JSEngineResolutionAlgorithm.JSC) {
      JSCInstance()
    } else {
      HermesInstance()
    }
    val jsMainModuleName = "index"
    val defaultReactHostDelegate =
      DefaultReactHostDelegate(
        jsMainModulePath = jsMainModuleName,
        jsBundleLoader = jsBundleLoader,
        reactPackages = getPackages(application),
        jsRuntimeFactory = jsRuntimeFactory,
        turboModuleManagerDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder()
      )
    val reactJsExceptionHandler = ReactJsExceptionHandler { _ -> }
    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)
    val useDeveloperSupport = launcherIp != null
    val reactHost = ReactHostImpl(
      application,
      defaultReactHostDelegate,
      componentFactory,
      useDeveloperSupport,
      reactJsExceptionHandler,
      useDeveloperSupport
    )
      .apply {
        jsEngineResolutionAlgorithm = jsResolutionAlgorithm
      }
    if (useDeveloperSupport) {
      injectDebugServerHost(application.applicationContext, reactHost, launcherIp!!, jsMainModuleName)
    }
    return reactHost
  }

  private fun getPackages(application: Application): List<ReactPackage> {
    val devMenuPackage = findDevMenuPackage()
    val devMenuRelatedPackages: List<ReactPackage> =
      if (devMenuPackage != null) {
        findPackagesWithDevMenuExtension(application) + devMenuPackage
      } else {
        emptyList()
      }

    val additionalPackages = (DevLauncherController.sAdditionalPackages ?: emptyList())

    return listOf(
      MainReactPackage(null),
      ModuleRegistryAdapter(
        ReactModuleRegistryProvider(emptyList()),
        object : ModulesProvider {
          override fun getModulesList() =
            listOf(
              DevMenuPreferences::class.java,
              SafeAreaProviderManager::class.java
            )
        }
      ),
      DevLauncherPackage()
    ) +
      devMenuRelatedPackages +
      additionalPackages
  }

  private fun createJSEngineResolutionAlgorithm(application: Application): JSEngineResolutionAlgorithm {
    SoLoader.init(application.applicationContext, /* native exopackage */ false)
    if (SoLoader.getLibraryPath("libjsc.so") != null) {
      return JSEngineResolutionAlgorithm.JSC
    }
    return JSEngineResolutionAlgorithm.HERMES
  }
}
