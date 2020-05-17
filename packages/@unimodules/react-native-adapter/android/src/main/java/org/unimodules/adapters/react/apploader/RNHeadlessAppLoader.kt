package org.unimodules.adapters.react.apploader

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import org.unimodules.apploader.HeadlessAppLoader
import org.unimodules.core.interfaces.Consumer
import org.unimodules.core.interfaces.DoNotStrip

private val appRecords: MutableMap<String, ReactInstanceManager> = mutableMapOf()

class RNHeadlessAppLoader @DoNotStrip constructor(private val context: Context) : HeadlessAppLoader {

  //region HeadlessAppLoader

  override fun loadApp(context: Context, params: HeadlessAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
    if (params == null || params.appId == null) {
      throw IllegalArgumentException("Params must be set with appId!")
    }

    if (context.applicationContext is ReactApplication) {
      val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
      if (!appRecords.containsKey(params.appId)) {
        reactInstanceManager.addReactInstanceEventListener {
          HeadlessAppLoaderNotifier.notifyAppLoaded(params.appId)
          callback?.apply(true)
        }
        appRecords[params.appId] = reactInstanceManager
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

  override fun invalidateApp(appId: String?): Boolean {
    return if (appRecords.containsKey(appId) && appRecords[appId] != null) {
      val appRecord: ReactInstanceManager = appRecords[appId]!!
      android.os.Handler(context.mainLooper).post {
        appRecord.destroy()
        HeadlessAppLoaderNotifier.notifyAppDestroyed(appId)
        appRecords.remove(appId)
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appId: String?): Boolean =
    appRecords.contains(appId) && appRecords[appId]!!.hasStartedCreatingInitialContext()

  //endregion HeadlessAppLoader
}
