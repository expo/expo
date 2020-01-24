package expo.modules.taskManager.apploader

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import expo.loaders.provider.interfaces.HeadlessAppStarter
import expo.modules.taskManager.TaskService
import org.unimodules.core.interfaces.Consumer

private val appRecords: MutableMap<String, ReactInstanceManager> = mutableMapOf()

class RNHeadlessAppStarter(private val context: Context) : HeadlessAppStarter {

  //region HeadlessAppStarter

  override fun startApp(context: Context, params: HeadlessAppStarter.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
    if (params == null || params.appId == null) {
      throw IllegalArgumentException("Params must be set with appId!")
    }

    val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
    if (!appRecords.containsKey(params.appId)) {
      reactInstanceManager.addReactInstanceEventListener {
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
  }

  override fun invalidateApp(appId: String?): Boolean {
    return if (appRecords.containsKey(appId) && appRecords[appId] != null) {
      val appRecord: ReactInstanceManager = appRecords[appId]!!
      android.os.Handler(context.mainLooper).post {
        appRecord.destroy()
        TaskService.clearTaskManager(appId)
        appRecords.remove(appId)
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appId: String?): Boolean =
    appRecords.contains(appId) && appRecords[appId]!!.hasStartedCreatingInitialContext()

  //endregion HeadlessAppStarter
}