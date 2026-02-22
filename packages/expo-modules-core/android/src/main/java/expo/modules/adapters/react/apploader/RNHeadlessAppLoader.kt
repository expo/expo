package expo.modules.adapters.react.apploader

import android.annotation.SuppressLint
import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.LifecycleState
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.core.interfaces.Consumer
import expo.modules.core.interfaces.DoNotStrip

private val appRecords: MutableMap<String, ReactContext> = mutableMapOf()

class RNHeadlessAppLoader @DoNotStrip constructor() : HeadlessAppLoader {

  //region HeadlessAppLoader

  override fun loadApp(
    context: Context,
    params: HeadlessAppLoader.Params?,
    alreadyRunning: Runnable?,
    callback: Consumer<Boolean>?
  ) {
    if (params == null || params.appScopeKey == null) {
      throw IllegalArgumentException("Params must be set with appScopeKey!")
    }

    if (context.applicationContext !is ReactApplication) {
      throw IllegalStateException("Your application must implement ReactApplication")
    }

    if (!appRecords.containsKey(params.appScopeKey)) {
      val reactHost = (context.applicationContext as ReactApplication).reactHost
        ?: throw IllegalStateException("Your application does not have a valid reactHost")
      reactHost.addReactInstanceEventListener(
        object : ReactInstanceEventListener {
          override fun onReactContextInitialized(context: ReactContext) {
            reactHost.removeReactInstanceEventListener(this)
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
      alreadyRunning?.run()
    }
  }

  @SuppressLint("VisibleForTests")
  override fun invalidateApp(appScopeKey: String?): Boolean {
    return if (appRecords.containsKey(appScopeKey) && appRecords[appScopeKey] != null) {
      val reactContext = appRecords[appScopeKey] ?: return false
      val reactHost = (reactContext.applicationContext as ReactApplication).reactHost
        ?: throw IllegalStateException("Your application does not have a valid reactHost")
      android.os.Handler(reactContext.mainLooper).post {
        // Only destroy the `ReactInstanceManager` if it does not bind with an Activity.
        // And The Activity would take over the ownership of `ReactInstanceManager`.
        // This case happens when a user clicks a background task triggered notification immediately.
        if (reactHost.lifecycleState == LifecycleState.BEFORE_CREATE) {
          reactHost.destroy("Closing headless task app", null)
        }
        appRecords.remove(appScopeKey)
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appScopeKey: String?): Boolean {
    // New architecture - We can return true since the fact that we have a reactContext
    // means that we've already called start on the reactHost
    return appRecords[appScopeKey] != null
  }
  //endregion HeadlessAppLoader
}
