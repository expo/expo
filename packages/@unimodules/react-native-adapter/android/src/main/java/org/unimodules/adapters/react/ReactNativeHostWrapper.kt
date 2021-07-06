package org.unimodules.adapters.react

import android.app.Application
import androidx.collection.ArrayMap
import com.facebook.infer.annotation.Assertions
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSIModule
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JSIModuleSpec
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.LifecycleState
import com.facebook.react.devsupport.RedBoxHandler
import com.facebook.react.uimanager.UIImplementationProvider
import java.lang.reflect.Method

class ReactNativeHostWrapper(application: Application, host: ReactNativeHost)
  : ReactNativeHost(application) {
  private val host = host
  private val reactNativeHostHandlers = ExpoModulesPackageList.getPackageList()
    .flatMap { it.createReactNativeHostHandlers(application) }
  private val methodMap: ArrayMap<String, Method> = ArrayMap()
  private var mReactInstanceManager: ReactInstanceManager? = null

  //region ReactNativeHost

  override fun getReactInstanceManager(): ReactInstanceManager {
    if (mReactInstanceManager == null) {
      ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_START)
      mReactInstanceManager = createReactInstanceManager()
      ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_END)
    }
    return mReactInstanceManager!!
  }

  override fun hasInstance(): Boolean {
    return mReactInstanceManager != null
  }

  override fun clear() {
    mReactInstanceManager?.let {
      it.destroy()
      mReactInstanceManager = null
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

  override fun getRedBoxHandler(): RedBoxHandler? {
    return invokeDelegateMethod("getRedBoxHandler")
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    return invokeDelegateMethod("getJavaScriptExecutorFactory")
  }

  override fun getUIImplementationProvider(): UIImplementationProvider {
    return invokeDelegateMethod("getUIImplementationProvider")
  }

  override fun getJSIModulePackage(): JSIModulePackage? {
    return invokeDelegateMethod("getJSIModulePackage")
  }

  override fun getJSMainModuleName(): String {
    return invokeDelegateMethod("getJSMainModuleName")
  }

  override fun getJSBundleFile(): String? {
    return invokeDelegateMethod("getJSBundleFile")
  }

  override fun getBundleAssetName(): String? {
    return invokeDelegateMethod("getBundleAssetName")
  }

  override fun getUseDeveloperSupport(): Boolean {
    return host.useDeveloperSupport
  }

  override fun getPackages(): MutableList<ReactPackage> {
    return invokeDelegateMethod("getPackages")
  }

  //endregion

  //region Internals

  inner class JSIModuleContainerPackage : JSIModulePackage {
    override fun getJSIModules(reactApplicationContext: ReactApplicationContext,
                               jsContext: JavaScriptContextHolder): List<JSIModuleSpec<JSIModule>> {
      reactNativeHostHandlers.forEach { handler ->
        handler.onRegisterJSIModules(reactApplicationContext, jsContext)
      }
      return emptyList()
    }
  }

  private fun getOverrideJSBundleFile(): String? {
    return reactNativeHostHandlers
      .map { it.getJSBundleFile() }
      .firstOrNull() ?: this.jsBundleFile
  }

  private fun getOverrideBundleAssetName(): String? {
    return reactNativeHostHandlers
      .map { it.getBundleAssetName() }
      .firstOrNull() ?: this.bundleAssetName
  }

  private fun <T> invokeDelegateMethod(name: String): T {
    var method = methodMap[name]
    if (method == null) {
      method = ReactNativeHost::class.java.getDeclaredMethod(name)
      method.isAccessible = true
      methodMap[name] = method
    }
    return method!!.invoke(host) as T
  }

  //endregion
}
