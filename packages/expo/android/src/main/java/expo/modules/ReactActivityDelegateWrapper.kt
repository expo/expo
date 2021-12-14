package expo.modules

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import androidx.collection.ArrayMap
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import com.facebook.react.modules.core.PermissionListener
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import java.lang.reflect.Method

class ReactActivityDelegateWrapper(
  private val activity: ReactActivity,
  private val delegate: ReactActivityDelegate
) : ReactActivityDelegate(activity, null) {
  private val reactActivityLifecycleListeners = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityLifecycleListeners(activity) }
  private val reactActivityHandlers = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityHandlers(activity) }
  private val methodMap: ArrayMap<String, Method> = ArrayMap()

  //region ReactActivityDelegate

  override fun getLaunchOptions(): Bundle? {
    return invokeDelegateMethod("getLaunchOptions")
  }

  override fun createRootView(): ReactRootView {
    return reactActivityHandlers.asSequence()
      .mapNotNull { it.createReactRootView(activity) }
      .firstOrNull() ?: invokeDelegateMethod("createRootView")
  }

  override fun getReactNativeHost(): ReactNativeHost {
    return invokeDelegateMethod("getReactNativeHost")
  }

  override fun getReactInstanceManager(): ReactInstanceManager {
    return delegate.reactInstanceManager
  }

  override fun getMainComponentName(): String? {
    return delegate.mainComponentName
  }

  override fun loadApp(appKey: String?) {
    return invokeDelegateMethod("loadApp", arrayOf(String::class.java), arrayOf(appKey))
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Since we just wrap `ReactActivityDelegate` but not inherit it, in its `onCreate`,
    // the calls to `createRootView()` or `getMainComponentName()` have no chances to be our wrapped methods.
    // Instead we intercept `ReactActivityDelegate.onCreate` and replace the `mReactDelegate` with our version.
    // That's not ideal but works.
    val reactDelegate = object : ReactDelegate(
      plainActivity, reactNativeHost, mainComponentName, launchOptions
    ) {
      override fun createRootView(): ReactRootView {
        return this@ReactActivityDelegateWrapper.createRootView()
      }
    }
    val mReactDelegate = ReactActivityDelegate::class.java.getDeclaredField("mReactDelegate")
    mReactDelegate.isAccessible = true
    mReactDelegate.set(delegate, reactDelegate)
    if (mainComponentName != null) {
      loadApp(mainComponentName)
    }

    reactActivityLifecycleListeners.forEach { listener ->
      listener.onCreate(activity, savedInstanceState)
    }
  }

  override fun onResume() {
    invokeDelegateMethod<Unit>("onResume")
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onResume(activity)
    }
  }

  override fun onPause() {
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onPause(activity)
    }
    return invokeDelegateMethod("onPause")
  }

  override fun onDestroy() {
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onDestroy(activity)
    }
    return invokeDelegateMethod("onDestroy")
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    delegate.onActivityResult(requestCode, resultCode, data)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    return delegate.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    return delegate.onKeyUp(keyCode, event)
  }

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
    return delegate.onKeyLongPress(keyCode, event)
  }

  override fun onBackPressed(): Boolean {
    val listenerResult = reactActivityLifecycleListeners
      .map(ReactActivityLifecycleListener::onBackPressed)
      .fold(false) { accu, current -> accu || current }
    val delegateResult = delegate.onBackPressed()
    return listenerResult || delegateResult
  }

  override fun onNewIntent(intent: Intent?): Boolean {
    val listenerResult = reactActivityLifecycleListeners
      .map { it.onNewIntent(intent) }
      .fold(false) { accu, current -> accu || current }
    val delegateResult = delegate.onNewIntent(intent)
    return listenerResult || delegateResult
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    delegate.onWindowFocusChanged(hasFocus)
  }

  override fun requestPermissions(permissions: Array<out String>?, requestCode: Int, listener: PermissionListener?) {
    delegate.requestPermissions(permissions, requestCode, listener)
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>?, grantResults: IntArray?) {
    delegate.onRequestPermissionsResult(requestCode, permissions, grantResults)
  }

  override fun getContext(): Context {
    return invokeDelegateMethod("getContext")
  }

  override fun getPlainActivity(): Activity {
    return invokeDelegateMethod("getPlainActivity")
  }

  //endregion

  //region Internals

  @Suppress("UNCHECKED_CAST")
  private fun <T> invokeDelegateMethod(name: String): T {
    var method = methodMap[name]
    if (method == null) {
      method = ReactActivityDelegate::class.java.getDeclaredMethod(name)
      method.isAccessible = true
      methodMap[name] = method
    }
    return method!!.invoke(delegate) as T
  }

  @Suppress("UNCHECKED_CAST")
  private fun <T, A> invokeDelegateMethod(
    name: String,
    argTypes: Array<Class<*>>,
    args: Array<A>
  ): T {
    var method = methodMap[name]
    if (method == null) {
      method = ReactActivityDelegate::class.java.getDeclaredMethod(name, *argTypes)
      method.isAccessible = true
      methodMap[name] = method
    }
    return method!!.invoke(delegate, *args) as T
  }

  //endregion
}
