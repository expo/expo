package expo.modules.devmenu.helpers

import android.content.Context
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.jscexecutor.JSCExecutorFactory
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.soloader.SoLoader


/**
 * Returns the [JavaScriptExecutorFactory] from application in case it override some custom [JavaScriptExecutorFactory],
 * otherwise, returns the default [JavaScriptExecutorFactory] (either [JSCExecutorFactory] or [HermesExecutorFactory]).
 */
fun ReactNativeHost.getAppJavaScriptExecutorFactory(applicationContext: Context): JavaScriptExecutorFactory? {
  if (isCyclingGetJavaScriptExecutorFactory()) {
    return null
  }
  (applicationContext as? ReactApplication)?.reactNativeHost?.run {
    val method = ReactNativeHost::class.java.getDeclaredMethod("getJavaScriptExecutorFactory")
    method.isAccessible = true
    val javaScriptExecutorFactory = method.invoke(this) as? JavaScriptExecutorFactory
    if (javaScriptExecutorFactory != null) {
      return javaScriptExecutorFactory
    }
  }

  return getDefaultJavaScriptExecutorFactory(applicationContext)
}

/**
 * Get the react-native default [JavaScriptExecutorFactory].
 *
 * To fix the crash from loading `ReactInstanceManagerBuilder.getDefaultJSExecutorFactory()` multiple times,
 * we use a non-try-catch solution here.
 * Ref: https://github.com/expo/expo/pull/16099
 */
private fun getDefaultJavaScriptExecutorFactory(applicationContext: Context): JavaScriptExecutorFactory {
  SoLoader.init(applicationContext, /* native exopackage */ false)
  if (SoLoader.getLibraryPath("libjsc.so") != null) {
    return JSCExecutorFactory(applicationContext.packageName, AndroidInfoHelpers.getFriendlyDeviceName())
  }
  return HermesExecutorFactory()
}

/**
 * Check whether it's a cycling call for [ReactNativeHost.getJavaScriptExecutorFactory].
 * Because in [ReactNativeHost.getJavaScriptExecutorFactory] we use reflection call to get the [JavaScriptExecutorFactory]
 * from application. In the ReactNativeHostWrapper, it will loop to this class again
 * and we don't want to override it this time.
 * We want to know whether there are other ReactNativeHostHandlers define the [JavaScriptExecutorFactory].
 * E.g. The V8ExpoAdapterPackage defines its [JavaScriptExecutorFactory].
 *
 * Note that this method is an inline method to save the stackTrace traversal easier.
 */
@Suppress("NOTHING_TO_INLINE")
private inline fun Any.isCyclingGetJavaScriptExecutorFactory(): Boolean {
  var counter = 0
  Thread.currentThread().stackTrace.iterator().forEach {
    if (it.className == this::class.java.name && it.methodName == "getJavaScriptExecutorFactory") {
      ++counter
    }
    if (counter >= 2) {
      return true
    }
  }
  return false
}