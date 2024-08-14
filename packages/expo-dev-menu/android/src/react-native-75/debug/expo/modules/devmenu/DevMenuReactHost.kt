package expo.modules.devmenu

import android.app.Application
import android.content.Context
import android.util.Log
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.defaults.DefaultComponentsRegistry
import com.facebook.react.defaults.DefaultReactHostDelegate
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.devsupport.DevMenuReactSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.fabric.ComponentFactory
import com.facebook.react.runtime.JSCInstance
import com.facebook.react.runtime.ReactHostImpl
import com.facebook.react.runtime.hermes.HermesInstance
import com.facebook.react.shell.MainReactPackage
import com.facebook.soloader.SoLoader
//import devmenu.com.th3rdwave.safeareacontext.SafeAreaProviderManager
import expo.modules.adapters.react.ModuleRegistryAdapter
import expo.modules.adapters.react.ReactModuleRegistryProvider
import expo.modules.devmenu.modules.DevMenuInternalModule
import expo.modules.devmenu.modules.DevMenuPreferences
import expo.modules.kotlin.ModulesProvider
import java.io.BufferedReader
import java.io.FileNotFoundException
import java.io.InputStreamReader

object DevMenuReactHost {

  @OptIn(UnstableReactNativeAPI::class)
  fun create(application: Application, useDeveloperSupport: Boolean): ReactHost {
    val jsBundleAssetPath = "EXDevMenuApp.android.js"
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
        reactPackages = getPackages(),
        jsRuntimeFactory = jsRuntimeFactory,
        turboModuleManagerDelegateBuilder = DefaultTurboModuleManagerDelegate.Builder()
      )
    val componentFactory = ComponentFactory()
    DefaultComponentsRegistry.register(componentFactory)
    val reactHost = ReactHostImpl(
      application,
      defaultReactHostDelegate,
      componentFactory,
      useDeveloperSupport,
      useDeveloperSupport
    )
      .apply {
        jsEngineResolutionAlgorithm = jsResolutionAlgorithm
      }
    if (useDeveloperSupport) {
      injectDevServerSettings(application.applicationContext, reactHost)
    }
    return reactHost
  }

  private fun getPackages(): List<ReactPackage> {
    val packages = mutableListOf(
      MainReactPackage(null),
      ModuleRegistryAdapter(
        ReactModuleRegistryProvider(emptyList()),
        object : ModulesProvider {
          override fun getModulesList() =
            listOf(
              DevMenuInternalModule::class.java,
              DevMenuPreferences::class.java,
//              SafeAreaProviderManager::class.java
            )
        }
      ),
      DevMenuPackage()
    )

    try {
      val devLauncherPackage = Class.forName("expo.modules.devlauncher.DevLauncherPackage")
      val pkg = devLauncherPackage.getConstructor().newInstance() as ReactPackage
      packages.add(pkg)
    } catch (e: ClassNotFoundException) {
      // dev launcher is not installed in this project
    }

    return packages
  }

  private fun createJSEngineResolutionAlgorithm(application: Application): JSEngineResolutionAlgorithm {
    SoLoader.init(application.applicationContext, /* native exopackage */ false)
    if (SoLoader.getLibraryPath("libjsc.so") != null) {
      return JSEngineResolutionAlgorithm.JSC
    }
    return JSEngineResolutionAlgorithm.HERMES
  }

  /**
   * To use a different packager url, we need to replace internal RN objects.
   */
  private fun injectDevServerSettings(applicationContext: Context, reactHost: ReactHostImpl) {
    try {
      val serverIp = BufferedReader(
        InputStreamReader(applicationContext.assets.open("dev-menu-packager-host"))
      ).use {
        it.readLine()
      }

      val devMenuInternalReactSettings = DevMenuReactSettings(applicationContext, serverIp)

      val devSupportManager = reactHost.devSupportManager
      val devSupportManagerBaseClass = devSupportManager.javaClass.superclass!!
      setPrivateField(
        obj = devSupportManager,
        objClass = devSupportManagerBaseClass,
        field = "mDevSettings",
        newValue = devMenuInternalReactSettings
      )

      val devServerHelper: DevServerHelper = getPrivateFiled(devSupportManager, devSupportManagerBaseClass, "mDevServerHelper")
      setPrivateField(
        obj = devServerHelper,
        objClass = devServerHelper.javaClass,
        field = "mSettings",
        newValue = devMenuInternalReactSettings
      )

      Log.i(DEV_MENU_TAG, "DevSettings was correctly injected.")
    } catch (e: FileNotFoundException) {
      Log.e(DEV_MENU_TAG, "Couldn't find `dev-menu-packager-host` file.", e)
    } catch (e: Exception) {
      Log.e(DEV_MENU_TAG, "Couldn't inject DevSettings object.", e)
    }
  }
}
