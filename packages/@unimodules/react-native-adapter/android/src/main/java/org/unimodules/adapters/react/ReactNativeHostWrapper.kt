package org.unimodules.adapters.react

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import com.facebook.infer.annotation.Assertions
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JSIModule
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JSIModuleSpec
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.LifecycleState
import org.unimodules.core.interfaces.ApplicationLifecycleListener
import org.unimodules.core.interfaces.ReactNativeHostHandler

abstract class ReactNativeHostWrapper(application: Application) : ReactNativeHost(application) {
  private val applicationLifecycleListeners: ArrayList<ApplicationLifecycleListener> = ArrayList()
  private val reactNativeHostHandlers: ArrayList<ReactNativeHostHandler> = ArrayList()
  init {
    for (pkg in ExpoModulesPackageList.getPackageList()) {
      applicationLifecycleListeners.addAll(pkg.createApplicationLifecycleListeners(application))
      reactNativeHostHandlers.addAll(pkg.createReactNativeHostHandlers(application))
    }
  }

  override fun createReactInstanceManager(): ReactInstanceManager {
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START)
    val builder = ReactInstanceManager.builder()
      .setApplication(application)
      .setJSMainModulePath(jsMainModuleName)
      .setUseDeveloperSupport(useDeveloperSupport)
      .setRedBoxHandler(redBoxHandler)
      .setJavaScriptExecutorFactory(javaScriptExecutorFactory)
      .setUIImplementationProvider(uiImplementationProvider)
      .setJSIModulesPackage(JSIModuleContainerPackage())
      .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)

    for (reactPackage in this.packages) {
      builder.addPackage(reactPackage)
    }

    val jsBundleFile = getOverrideJSBundleFile()
    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile)
    } else {
      builder.setBundleAssetName(Assertions.assertNotNull(getOverrideBundleAssetName()))
    }
    val reactInstanceManager = builder.build()
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_END)
    return reactInstanceManager
  }

  //region internals

  inner class JSIModuleContainerPackage : JSIModulePackage {
    override fun getJSIModules(reactApplicationContext: ReactApplicationContext, jsContext: JavaScriptContextHolder): List<JSIModuleSpec<JSIModule>> {
      for (handler in reactNativeHostHandlers) {
        handler.onRegisterJSIModules(reactApplicationContext, jsContext)
      }
      return emptyList()
    }
  }

  private fun getOverrideJSBundleFile(): String? {
    for (handler in reactNativeHostHandlers) {
      val jsBundleFile = handler.getJSBundleFile()
      if (jsBundleFile != null) {
        return jsBundleFile
      }
    }
    return this.jsBundleFile
  }

  private fun getOverrideBundleAssetName(): String? {
    for (handler in reactNativeHostHandlers) {
      val bundleAssetName = handler.getBundleAssetName()
      if (bundleAssetName != null) {
        return bundleAssetName
      }
    }
    return this.bundleAssetName
  }

  //endregion

  //region ApplicationLifecycle

  fun onApplicationCreate(application: Application) {
    for (listener in applicationLifecycleListeners) {
      listener.onCreate(application)
    }
  }

  fun onApplicationConfigurationChanged(context: Context, newConfig: Configuration) {
    for (listener in applicationLifecycleListeners) {
      listener.onConfigurationChanged(newConfig)
    }
  }

  //endregion
}
