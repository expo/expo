package expo.modules.splashscreen

import android.content.Context
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.UIManager
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder

/**
 * The context of the prerender's standalone `FabricUIManager`. There is no React instance behind it:
 * the view managers only use it as a context, and text measurement for its asset manager.
 */
@Suppress("DEPRECATION")
internal class SplashScreenPrerenderContext(context: Context) : ReactApplicationContext(context) {
  var uiManager: UIManager? = null

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T =
    throw UnsupportedOperationException("The splash screen prerender has no JS runtime")

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean = false

  override fun getNativeModules(): Collection<NativeModule> = emptyList()

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? = null

  override fun getNativeModule(moduleName: String): NativeModule? = null

  override fun getCatalystInstance(): CatalystInstance =
    throw UnsupportedOperationException("The splash screen prerender has no React instance")

  override fun hasActiveCatalystInstance(): Boolean = false

  override fun hasActiveReactInstance(): Boolean = false

  override fun hasCatalystInstance(): Boolean = false

  override fun hasReactInstance(): Boolean = false

  override fun getRuntimeExecutor(): RuntimeExecutor? = null

  override fun destroy() = Unit

  override fun handleException(e: Exception) {
    throw e
  }

  override fun isBridgeless(): Boolean = true

  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? = null

  override fun getJSCallInvokerHolder(): CallInvokerHolder? = null

  override fun getFabricUIManager(): UIManager? = uiManager

  override fun getSourceURL(): String? = null

  override fun registerSegment(segmentId: Int, path: String, callback: Callback) = Unit
}
