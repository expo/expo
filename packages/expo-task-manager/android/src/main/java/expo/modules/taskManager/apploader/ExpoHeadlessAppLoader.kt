package expo.modules.taskManager.apploader

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import org.unimodules.core.interfaces.Consumer
import org.unimodules.core.interfaces.SingletonModule
import expo.loaders.provider.interfaces.TaskManagerAppLoader
import java.util.*
import java.util.logging.Handler

class ExpoHeadlessAppLoader(val ignore: Context) : TaskManagerAppLoader, SingletonModule {

    override fun loadApp(context: Context, params: TaskManagerAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
        if (params == null || params.appId == null) {
            throw IllegalArgumentException("Params must be set with appId!")
        }

        val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
        if (!appRecords.containsKey(params.appId) && !isReactInstanceRunning(reactInstanceManager)) {
            reactInstanceManager.addReactInstanceEventListener {
                callback?.apply(true)
            }
            appRecords.put(params.appId, reactInstanceManager)
            reactInstanceManager.createReactContextInBackground()
        } else {
            alreadyRunning?.run()
        }
    }

    override fun invalidateApp(appId: String?): Boolean {
        return if (appRecords.containsKey(appId)) {
            android.os.Handler(ignore.mainLooper).post {
              appRecords[appId]!!.destroy()
            }
            true
        } else {
            false
        }
    }

    private fun isReactInstanceRunning(reactInstanceManager: ReactInstanceManager): Boolean {
        return reactInstanceManager.hasStartedCreatingInitialContext()
    }

    override fun getName(): String = "TaskManagerAppLoader"

    companion object {
        // { "<appId>": AppRecordInterface }
        private val appRecords: MutableMap<String, ReactInstanceManager> = HashMap()
    }

}