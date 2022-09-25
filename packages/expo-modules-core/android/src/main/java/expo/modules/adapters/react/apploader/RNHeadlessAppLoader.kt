package expo.modules.adapters.react.apploader

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.common.LifecycleState
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.core.interfaces.Consumer
import expo.modules.core.interfaces.DoNotStrip

private val appRecords: MutableMap<String, ReactInstanceManager> = mutableMapOf()

class RNHeadlessAppLoader @DoNotStrip constructor(private val context: Context) : HeadlessAppLoader {

  //region HeadlessAppLoader

  override fun loadApp(context: Context, params: HeadlessAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
    if (params == null || params.appScopeKey == null) {
      throw IllegalArgumentException("Params must be set with appScopeKey!")
    }

    if (context.applicationContext is ReactApplication) {
      val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
      if (!appRecords.containsKey(params.appScopeKey)) {
        reactInstanceManager.addReactInstanceEventListener {
          HeadlessAppLoaderNotifier.notifyAppLoaded(params.appScopeKey)
          callback?.apply(true)
        }
        appRecords[params.appScopeKey] = reactInstanceManager
        if (reactInstanceManager.hasStartedCreatingInitialContext()) {
          reactInstanceManager.recreateReactContextInBackground()
        } else {
          reactInstanceManager.createReactContextInBackground()
        }
      } else {
        alreadyRunning?.run()
      }
    } else {
      throw IllegalStateException("Your application must implement ReactApplication")
    }
  }

  override fun invalidateApp(appScopeKey: String?): Boolean {
    return if (appRecords.containsKey(appScopeKey) && appRecords[appScopeKey] != null) {
      val appRecord: ReactInstanceManager = appRecords[appScopeKey]!!
      android.os.Handler(context.mainLooper).post {
        // Only destroy the `ReactInstanceManager` if it does not bind with an Activity.
        // And The Activity would take over the ownership of `ReactInstanceManager`.
        // This case happens when a user clicks a background task triggered notification immediately.
        if (appRecord.lifecycleState == LifecycleState.BEFORE_CREATE) {
          appRecord.destroy()
        }
        HeadlessAppLoaderNotifier.notifyAppDestroyed(appScopeKey)
        appRecords.remove(appScopeKey)
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appScopeKey: String?): Boolean =
    appRecords.contains(appScopeKey) && appRecords[appScopeKey]!!.hasStartedCreatingInitialContext()

  //endregion HeadlessAppLoader
}
