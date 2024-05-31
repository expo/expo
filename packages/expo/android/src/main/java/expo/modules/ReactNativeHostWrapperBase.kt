package expo.modules

import android.app.Application
import androidx.collection.ArrayMap
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactContext
import java.lang.reflect.Method

open class ReactNativeHostWrapperBase(
  application: Application,
  protected val host: ReactNativeHost
) : ReactNativeHost(application) {
  // TODO: Inherit from DefaultReactNativeHost when we drop SDK 49 support

  internal val reactNativeHostHandlers = ExpoModulesPackage.packageList
    .flatMap { it.createReactNativeHostHandlers(application) }
  private val methodMap: ArrayMap<String, Method> = ArrayMap()

  override fun createReactInstanceManager(): ReactInstanceManager {
    val developerSupport = useDeveloperSupport
    reactNativeHostHandlers.forEach { handler ->
      handler.onWillCreateReactInstance(developerSupport)
    }

    val result = super.createReactInstanceManager()

    reactNativeHostHandlers.forEach { handler ->
      handler.onDidCreateDevSupportManager(result.devSupportManager)
    }

    result.addReactInstanceEventListener(object : ReactInstanceEventListener {
      override fun onReactContextInitialized(context: ReactContext) {
        reactNativeHostHandlers.forEach { handler ->
          handler.onDidCreateReactInstance(developerSupport, context)
        }
      }
    })

    injectHostReactInstanceManager(result)

    return result
  }

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.javaScriptExecutorFactory }
      .firstOrNull() ?: invokeDelegateMethod("getJavaScriptExecutorFactory")
  }

  public override fun getJSMainModuleName(): String {
    return invokeDelegateMethod("getJSMainModuleName")
  }

  public override fun getJSBundleFile(): String? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.getJSBundleFile(useDeveloperSupport) }
      .firstOrNull() ?: invokeDelegateMethod<String?>("getJSBundleFile")
  }

  public override fun getBundleAssetName(): String? {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.getBundleAssetName(useDeveloperSupport) }
      .firstOrNull() ?: invokeDelegateMethod<String?>("getBundleAssetName")
  }

  override fun getUseDeveloperSupport(): Boolean {
    return reactNativeHostHandlers.asSequence()
      .mapNotNull { it.useDeveloperSupport }
      .firstOrNull() ?: host.useDeveloperSupport
  }

  public override fun getPackages(): MutableList<ReactPackage> {
    return invokeDelegateMethod("getPackages")
  }

  //endregion

  //region Internals

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
  private fun injectHostReactInstanceManager(reactInstanceManager: ReactInstanceManager) {
    val mReactInstanceManagerField = ReactNativeHost::class.java.getDeclaredField("mReactInstanceManager")
    mReactInstanceManagerField.isAccessible = true
    mReactInstanceManagerField.set(host, reactInstanceManager)
  }

  //endregion
}
