package expo.modules.adapters.react.apploader

import android.annotation.SuppressLint
import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import expo.modules.BuildConfig
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.core.interfaces.Consumer
import expo.modules.core.interfaces.DoNotStrip

private val appRecords: MutableMap<String, ReactContext> = mutableMapOf()

class RNHeadlessAppLoader @DoNotStrip constructor(private val context: Context) : HeadlessAppLoader {

  //region HeadlessAppLoader

  override fun loadApp(context: Context, params: HeadlessAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
    if (params == null || params.appScopeKey == null) {
      throw IllegalArgumentException("Params must be set with appScopeKey!")
    }

    if (context.applicationContext is ReactApplication) {
      if (!appRecords.containsKey(params.appScopeKey)) {
        // In old arch reactHost will be null
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
          // New architecture
          val reactHost = (context.applicationContext as ReactApplication).reactHost ?: throw IllegalStateException("Your application does not have a valid reactHost")
          reactHost.addReactInstanceEventListener(
            object : ReactInstanceEventListener {
              override fun onReactContextInitialized(context: ReactContext) {
                reactHost.removeReactInstanceEventListener(this)
                HeadlessAppLoaderNotifier.notifyAppLoaded(params.appScopeKey)
                appRecords[params.appScopeKey] = context
                callback?.apply(true)
              }
            }
          )
          // Ensure that we're starting the react host on the main thread
          android.os.Handler(context.mainLooper).post {
            reactHost.start()
          }
        } else {
          // Old architecture
          val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
          reactInstanceManager.addReactInstanceEventListener(
            object : ReactInstanceEventListener {
              override fun onReactContextInitialized(context: ReactContext) {
                HeadlessAppLoaderNotifier.notifyAppLoaded(params.appScopeKey)
                reactInstanceManager.removeReactInstanceEventListener(this)
                appRecords[params.appScopeKey] = context
                callback?.apply(true)
              }
            }
          )
          // Ensure that we're starting the react host on the main thread
          android.os.Handler(context.mainLooper).post {
            reactInstanceManager.createReactContextInBackground()
          }
        }
      } else {
        alreadyRunning?.run()
      }
    } else {
      throw IllegalStateException("Your application must implement ReactApplication")
    }
  }

  @SuppressLint("VisibleForTests")
  override fun invalidateApp(appScopeKey: String?): Boolean {
    return if (appRecords.containsKey(appScopeKey) && appRecords[appScopeKey] != null) {
      val reactContext = appRecords[appScopeKey] ?: return false
      if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        // New architecture
        val reactHost = (reactContext.applicationContext as ReactApplication).reactHost ?: throw IllegalStateException("Your application does not have a valid reactHost")
        android.os.Handler(reactContext.mainLooper).post {
          // Only destroy the `ReactInstanceManager` if it does not bind with an Activity.
          // And The Activity would take over the ownership of `ReactInstanceManager`.
          // This case happens when a user clicks a background task triggered notification immediately.
          if (reactHost.lifecycleState == LifecycleState.BEFORE_CREATE) {
            reactHost.destroy("Closing headless task app", null)
          }
          HeadlessAppLoaderNotifier.notifyAppDestroyed(appScopeKey)
          appRecords.remove(appScopeKey)
        }
      } else {
        // Old architecture
        val reactNativeHost = (reactContext.applicationContext as ReactApplication).reactNativeHost
        if (reactNativeHost.hasInstance()) {
          val reactInstanceManager: ReactInstanceManager = reactNativeHost.reactInstanceManager
          android.os.Handler(reactContext.mainLooper).post {
            // Only destroy the `ReactInstanceManager` if it does not bind with an Activity.
            // And The Activity would take over the ownership of `ReactInstanceManager`.
            // This case happens when a user clicks a background task triggered notification immediately.
            if (reactInstanceManager.lifecycleState == LifecycleState.BEFORE_CREATE) {
              reactInstanceManager.destroy()
            }
            HeadlessAppLoaderNotifier.notifyAppDestroyed(appScopeKey)
            appRecords.remove(appScopeKey)
          }
        }
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appScopeKey: String?): Boolean {
    val reactContext = appRecords[appScopeKey] ?: return false
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // New architecture - We can return true since the fact that we have a reactContext
      // means that we've already called start on the reactHost
      return true
    } else {
      // Old architecture
      val reactNativeHost = (reactContext.applicationContext as ReactApplication).reactNativeHost
      return reactNativeHost.reactInstanceManager.hasStartedCreatingInitialContext()
    }
  }

  //endregion HeadlessAppLoader
}
