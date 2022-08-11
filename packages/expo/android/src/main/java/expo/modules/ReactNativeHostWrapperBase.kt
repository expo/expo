package expo.modules

import android.app.Application
import androidx.collection.ArrayMap
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSIModule
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JSIModuleSpec
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactApplicationContext
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

    injectHostReactInstanceManager(result)

    return result
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.javaScriptExecutorFactory }
      .firstOrNull() ?: invokeDelegateMethod("getJavaScriptExecutorFactory")
  }

  @Suppress("DEPRECATION")
  override fun getUIImplementationProvider(): com.facebook.react.uimanager.UIImplementationProvider {
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
      return userJSIModulePackage?.getJSIModules(reactApplicationContext, jsContext)?.toList() ?: emptyList()
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

  /**
   * Inject the @{ReactInstanceManager} from the wrapper to the wrapped host.
   * In case the wrapped host to call `getReactInstanceManager` inside its methods.
   */
  fun injectHostReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    val mReactInstanceManagerField = ReactNativeHost::class.java.getDeclaredField("mReactInstanceManager")
    mReactInstanceManagerField.isAccessible = true
    mReactInstanceManagerField.set(host, reactInstanceManager)
  }

  //endregion
}
