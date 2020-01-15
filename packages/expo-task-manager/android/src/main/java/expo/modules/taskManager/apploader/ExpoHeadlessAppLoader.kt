package expo.modules.taskManager.apploader

import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import org.unimodules.core.interfaces.Consumer
import org.unimodules.core.interfaces.SingletonModule
import expo.loaders.provider.interfaces.TaskManagerAppLoader
import java.util.*

class ExpoHeadlessAppLoader : TaskManagerAppLoader, SingletonModule {

    override fun loadApp(context: Context, params: TaskManagerAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
        if (params == null || params.appId == null) {
           throw IllegalArgumentException("Params must be set with appId!")
        }

        val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
        if (appRecords.containsKey(params.appId) && !isReactInstanceRunning(reactInstanceManager)) {
            reactInstanceManager.addReactInstanceEventListener {
                callback?.apply(true)
                reactInstanceManager.packages
            }
            reactInstanceManager.createReactContextInBackground()
            appRecords.put(params.appId, reactInstanceManager)
        } else {
            alreadyRunning?.run()
        }
    }

    override fun invalidateApp(appId: String?): Boolean {
        return if(appRecords.containsKey(appId)) {
            appRecords[appId]!!.destroy()
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