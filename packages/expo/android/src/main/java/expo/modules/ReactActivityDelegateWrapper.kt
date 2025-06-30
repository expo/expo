package expo.modules

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Build.VERSION
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.ViewGroup
import androidx.annotation.VisibleForTesting
import androidx.collection.ArrayMap
import androidx.lifecycle.lifecycleScope
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.PermissionListener
import expo.modules.core.interfaces.ReactActivityHandler.DelayLoadAppHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.kotlin.Utils
import expo.modules.rncompatibility.ReactNativeFeatureFlags
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.launch
import java.lang.reflect.Field
import java.lang.reflect.Method
import java.lang.reflect.Modifier
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

class ReactActivityDelegateWrapper(
  private val activity: ReactActivity,
  private val isNewArchitectureEnabled: Boolean,
  @get:VisibleForTesting internal var delegate: ReactActivityDelegate
) : ReactActivityDelegate(activity, null) {
  constructor(activity: ReactActivity, delegate: ReactActivityDelegate) :
    this(activity, false, delegate)

  private val reactActivityLifecycleListeners = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityLifecycleListeners(activity) }
  private val reactActivityHandlers = ExpoModulesPackage.packageList
    .flatMap { it.createReactActivityHandlers(activity) }
  private val methodMap: ArrayMap<String, Method> = ArrayMap()
  private val _reactNativeHost: ReactNativeHost by lazy {
    invokeDelegateMethod("getReactNativeHost")
  }
  private val _reactHost: ReactHost? by lazy {
    delegate.reactHost
  }
  private val delayLoadAppHandler: DelayLoadAppHandler? by lazy {
    reactActivityHandlers.asSequence()
      .mapNotNull { it.getDelayLoadAppHandler(activity, reactNativeHost) }
      .firstOrNull()
  }

  /**
   * When the app delay for `loadApp`, the React Native lifecycle will be disrupted.
   * This flag indicates we should emit `onResume` after `loadApp`.
   */
  private var shouldEmitPendingResume = false

  //region ReactActivityDelegate

  override fun getLaunchOptions(): Bundle? {
    return invokeDelegateMethod("getLaunchOptions")
  }

  override fun createRootView(): ReactRootView? {
    return invokeDelegateMethod("createRootView")
  }

  override fun getReactDelegate(): ReactDelegate? {
    return invokeDelegateMethod("getReactDelegate")
  }

  override fun getReactNativeHost(): ReactNativeHost {
    return _reactNativeHost
  }

  override fun getReactHost(): ReactHost? {
    return _reactHost
  }

  override fun getReactInstanceManager(): ReactInstanceManager {
    return delegate.reactInstanceManager
  }

  override fun getMainComponentName(): String? {
    return delegate.mainComponentName
  }

  override fun loadApp(appKey: String?) {
    activity.lifecycleScope.launch(start = CoroutineStart.UNDISPATCHED) {
      loadAppImpl(appKey, supportsDelayLoad = true)
    }
  }

  @SuppressLint("DiscouragedPrivateApi")
  override fun onCreate(savedInstanceState: Bundle?) {
    // Give handlers a chance as early as possible to replace the wrapped delegate object.
    // If they do, we call the new wrapped delegate's `onCreate` instead of overriding it here.
    val newDelegate = reactActivityHandlers.asSequence()
      .mapNotNull { it.onDidCreateReactActivityDelegate(activity, this) }
      .firstOrNull()
    if (newDelegate != null && newDelegate != this) {
      val mDelegateField = ReactActivity::class.java.getDeclaredField("mDelegate")
      mDelegateField.isAccessible = true
      val modifiers = Field::class.java.getDeclaredField("accessFlags")
      modifiers.isAccessible = true
      modifiers.setInt(mDelegateField, mDelegateField.modifiers and Modifier.FINAL.inv())
      mDelegateField.set(activity, newDelegate)
      delegate = newDelegate

      delegate.onCreate(savedInstanceState)
    } else {
      // Since we just wrap `ReactActivityDelegate` but not inherit it, in its `onCreate`,
      // the calls to `createRootView()` or `getMainComponentName()` have no chances to be our wrapped methods.
      // Instead we intercept `ReactActivityDelegate.onCreate` and replace the `mReactDelegate` with our version.
      // That's not ideal but works.

      activity.lifecycleScope.launch(start = CoroutineStart.UNDISPATCHED) {
        awaitDelayLoadAppWhenReady(delayLoadAppHandler)

        if (VERSION.SDK_INT >= Build.VERSION_CODES.O && isWideColorGamutEnabled) {
          activity.window.colorMode = ActivityInfo.COLOR_MODE_WIDE_COLOR_GAMUT
        }

        val launchOptions = composeLaunchOptions()
        val reactDelegate: ReactDelegate
        if (ReactNativeFeatureFlags.enableBridgelessArchitecture) {
          reactDelegate = ReactDelegate(
            plainActivity,
            reactHost,
            mainComponentName,
            launchOptions
          )
        } else {
          reactDelegate = object : ReactDelegate(
            plainActivity,
            reactNativeHost,
            mainComponentName,
            launchOptions,
            isFabricEnabled
          ) {
            override fun createRootView(): ReactRootView {
              return this@ReactActivityDelegateWrapper.createRootView() ?: super.createRootView()
            }
          }
        }

        val mReactDelegate = ReactActivityDelegate::class.java.getDeclaredField("mReactDelegate")
        mReactDelegate.isAccessible = true
        mReactDelegate.set(delegate, reactDelegate)
        if (mainComponentName != null) {
          loadAppImpl(mainComponentName, supportsDelayLoad = false)
        }
      }
    }

    reactActivityLifecycleListeners.forEach { listener ->
      listener.onCreate(activity, savedInstanceState)
    }
  }

  override fun onResume() {
    if (shouldEmitPendingResume) {
      return
    }
    delegate.onResume()
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onResume(activity)
    }
  }

  override fun onPause() {
    // If app is stopped before the delayed `loadApp`, we should cancel the pending resume
    // and avoid propagating the pause event because the state was never resumed.
    if (shouldEmitPendingResume) {
      shouldEmitPendingResume = false
      return
    }
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onPause(activity)
    }
    if (delayLoadAppHandler != null) {
      try {
        // For the delay load case, we may enter a different call flow than react-native.
        // For example, Activity stopped before delay load finished.
        // We stop before the ReactActivityDelegate gets a chance to set up.
        // In this case, we should catch the exceptions.
        delegate.onPause()
      } catch (e: Exception) {
        Log.e(TAG, "Exception occurred during onPause with delayed app loading", e)
      }
    } else {
      delegate.onPause()
    }
  }

  override fun onUserLeaveHint() {
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onUserLeaveHint(activity)
    }
    delegate.onUserLeaveHint()
  }

  override fun onDestroy() {
    // If app is stopped before the delayed `loadApp`, we should cancel the pending resume
    // and avoid propagating the destroy event because the state was never resumed.
    if (shouldEmitPendingResume) {
      shouldEmitPendingResume = false
      return
    }
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onDestroy(activity)
    }
    if (delayLoadAppHandler != null) {
      try {
        // For the delay load case, we may enter a different call flow than react-native.
        // For example, Activity stopped before delay load finished.
        // We stop before the ReactActivityDelegate gets a chance to set up.
        // In this case, we should catch the exceptions.
        delegate.onDestroy()
      } catch (e: Exception) {
        Log.e(TAG, "Exception occurred during onDestroy with delayed app loading", e)
      }
    } else {
      delegate.onDestroy()
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    /**
     * Workaround for a problem when results from [onActivityResult] are not properly delivered to modules.
     * It happens when Android kills the [Activity] upon low memory scenario and recreates it later on.
     *
     * In [com.facebook.react.ReactInstanceManager.onActivityResult] you can see that if
     * [com.facebook.react.bridge.ReactContext] is null then React would not broadcast the result to the modules
     * and thus [expo.modules.kotlin.AppContext] would not be triggered properly.
     *
     * If [com.facebook.react.bridge.ReactContext] is not available when [onActivityResult] is called then
     * let us wait for it and invoke [onActivityResult] once it's available.
     *
     * TODO (@bbarthec): fix it upstream?
     */
    if (!ReactNativeFeatureFlags.enableBridgelessArchitecture && delegate.reactInstanceManager.currentReactContext == null) {
      val reactContextListener = object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
          delegate.reactInstanceManager.removeReactInstanceEventListener(this)
          delegate.onActivityResult(requestCode, resultCode, data)
        }
      }
      return delegate.reactInstanceManager.addReactInstanceEventListener(reactContextListener)
    }

    delegate.onActivityResult(requestCode, resultCode, data)
  }

  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    // if any of the handlers return true, intentionally consume the event instead of passing it
    // through to the delegate
    return reactActivityHandlers
      .map { it.onKeyDown(keyCode, event) }
      .fold(false) { accu, current -> accu || current } || delegate.onKeyDown(keyCode, event)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
    // if any of the handlers return true, intentionally consume the event instead of passing it
    // through to the delegate
    return reactActivityHandlers
      .map { it.onKeyUp(keyCode, event) }
      .fold(false) { accu, current -> accu || current } || delegate.onKeyUp(keyCode, event)
  }

  override fun onKeyLongPress(keyCode: Int, event: KeyEvent?): Boolean {
    // if any of the handlers return true, intentionally consume the event instead of passing it
    // through to the delegate
    return reactActivityHandlers
      .map { it.onKeyLongPress(keyCode, event) }
      .fold(false) { accu, current -> accu || current } || delegate.onKeyLongPress(keyCode, event)
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

  override fun isFabricEnabled(): Boolean {
    return invokeDelegateMethod("isFabricEnabled")
  }

  override fun isWideColorGamutEnabled(): Boolean {
    return invokeDelegateMethod("isWideColorGamutEnabled")
  }

  override fun composeLaunchOptions(): Bundle? {
    return invokeDelegateMethod("composeLaunchOptions")
  }

  override fun onConfigurationChanged(newConfig: Configuration?) {
    delegate.onConfigurationChanged(newConfig)
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

  @VisibleForTesting
  @Suppress("UNCHECKED_CAST")
  internal fun <T, A> invokeDelegateMethod(
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

  private suspend fun loadAppImpl(appKey: String?, supportsDelayLoad: Boolean) {
    // Give modules a chance to wrap the ReactRootView in a container ViewGroup. If some module
    // wants to do this, we override the functionality of `loadApp` and call `setContentView` with
    // the new container view instead.
    val rootViewContainer = reactActivityHandlers.asSequence()
      .mapNotNull { it.createReactRootViewContainer(activity) }
      .firstOrNull()
    if (rootViewContainer != null) {
      val mReactDelegate = ReactActivityDelegate::class.java.getDeclaredField("mReactDelegate")
      mReactDelegate.isAccessible = true
      val reactDelegate = mReactDelegate[delegate] as ReactDelegate

      reactDelegate.loadApp(appKey)
      val reactRootView = reactDelegate.reactRootView
      (reactRootView?.parent as? ViewGroup)?.removeView(reactRootView)
      rootViewContainer.addView(reactRootView, ViewGroup.LayoutParams.MATCH_PARENT)
      activity.setContentView(rootViewContainer)
      reactActivityLifecycleListeners.forEach { listener ->
        listener.onContentChanged(activity)
      }
      return
    }

    if (supportsDelayLoad) {
      awaitDelayLoadAppWhenReady(delayLoadAppHandler)
      invokeDelegateMethod<Unit, String?>("loadApp", arrayOf(String::class.java), arrayOf(appKey))
      reactActivityLifecycleListeners.forEach { listener ->
        listener.onContentChanged(activity)
      }
      if (shouldEmitPendingResume) {
        shouldEmitPendingResume = false
        onResume()
      }
      return
    }

    invokeDelegateMethod<Unit, String?>("loadApp", arrayOf(String::class.java), arrayOf(appKey))
    reactActivityLifecycleListeners.forEach { listener ->
      listener.onContentChanged(activity)
    }
    if (shouldEmitPendingResume) {
      shouldEmitPendingResume = false
      onResume()
    }
  }

  private suspend fun awaitDelayLoadAppWhenReady(delayLoadAppHandler: DelayLoadAppHandler?) {
    if (delayLoadAppHandler == null) {
      return
    }
    shouldEmitPendingResume = true
    suspendCoroutine { continuation ->
      delayLoadAppHandler.whenReady {
        Utils.assertMainThread()
        continuation.resume(Unit)
      }
    }
  }

  //endregion

  companion object {
    private val TAG = ReactActivityDelegate::class.simpleName
  }
}
