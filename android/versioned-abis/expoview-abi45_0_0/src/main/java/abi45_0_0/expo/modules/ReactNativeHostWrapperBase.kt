package abi45_0_0.expo.modules

import android.app.Application
import androidx.collection.ArrayMap
import abi45_0_0.com.facebook.react.ReactInstanceManager
import abi45_0_0.com.facebook.react.ReactNativeHost
import abi45_0_0.com.facebook.react.ReactPackage
import abi45_0_0.com.facebook.react.bridge.JSIModule
import abi45_0_0.com.facebook.react.bridge.JSIModulePackage
import abi45_0_0.com.facebook.react.bridge.JSIModuleSpec
import abi45_0_0.com.facebook.react.bridge.JavaScriptContextHolder
import abi45_0_0.com.facebook.react.bridge.JavaScriptExecutorFactory
import abi45_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi45_0_0.com.facebook.react.devsupport.RedBoxHandler
import java.lang.reflect.Method

open class ReactNativeHostWrapperBase(
  application: Application,
  protected val host: ReactNativeHost
) : ReactNativeHost(application) {
  internal val reactNativeHostHandlers = ExpoModulesPackage.packageList
    .flatMap { it.createReactNativeHostHandlers(application) }
  private val methodMap: ArrayMap<String, Method> = ArrayMap()

  override fun createReactInstanceManager(): ReactInstanceManager {
    val developerSupport = useDeveloperSupport
    reactNativeHostHandlers.forEach { handler ->
      handler.onWillCreateReactInstanceManager(developerSupport)
    }

    val result = reactNativeHostHandlers.asSequence()
      .mapNotNull { it.createReactInstanceManager(developerSupport) }
      .firstOrNull() ?: super.createReactInstanceManager()

    reactNativeHostHandlers.forEach { handler ->
      handler.onDidCreateReactInstanceManager(result, developerSupport)
    }

    return result
  }

  override fun getRedBoxHandler(): RedBoxHandler? {
    return invokeDelegateMethod("getRedBoxHandler")
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.javaScriptExecutorFactory }
      .firstOrNull() ?: invokeDelegateMethod("getJavaScriptExecutorFactory")
  }

  @Suppress("DEPRECATION")
  override fun getUIImplementationProvider(): abi45_0_0.com.facebook.react.uimanager.UIImplementationProvider {
    return invokeDelegateMethod("getUIImplementationProvider")
  }

  override fun getJSIModulePackage(): JSIModulePackage? {
    val userJSIModulePackage = invokeDelegateMethod<JSIModulePackage?>("getJSIModulePackage")
    return JSIModuleContainerPackage(userJSIModulePackage)
  }

  override fun getJSMainModuleName(): String {
    return invokeDelegateMethod("getJSMainModuleName")
  }

  override fun getJSBundleFile(): String? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.getJSBundleFile(useDeveloperSupport) }
      .firstOrNull() ?: invokeDelegateMethod<String?>("getJSBundleFile")
  }

  override fun getBundleAssetName(): String? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.getBundleAssetName(useDeveloperSupport) }
      .firstOrNull() ?: invokeDelegateMethod<String?>("getBundleAssetName")
  }

  override fun getUseDeveloperSupport(): Boolean {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.useDeveloperSupport }
      .firstOrNull() ?: host.useDeveloperSupport
  }

  override fun getPackages(): MutableList<ReactPackage> {
    return invokeDelegateMethod("getPackages")
  }

  //endregion

  //region Internals

  inner class JSIModuleContainerPackage(userJSIModulePackage: JSIModulePackage?) : JSIModulePackage {
    private val userJSIModulePackage = userJSIModulePackage
    override fun getJSIModules(
      reactApplicationContext: ReactApplicationContext,
      jsContext: JavaScriptContextHolder
    ): List<JSIModuleSpec<JSIModule>> {
      reactNativeHostHandlers.forEach { handler ->
        handler.onRegisterJSIModules(reactApplicationContext, jsContext, useDeveloperSupport)
      }
      userJSIModulePackage?.getJSIModules(reactApplicationContext, jsContext)
      return emptyList()
    }
  }

  @Suppress("UNCHECKED_CAST")
  internal fun <T> invokeDelegateMethod(name: String): T {
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
