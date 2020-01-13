package expo.modules.taskManager.apploader

import android.content.Context
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import expo.loaders.provider.AppLoaderProvider
import expo.loaders.provider.interfaces.AppLoaderInterface
import expo.loaders.provider.interfaces.AppRecordInterface
import org.unimodules.interfaces.taskManager.TaskInterface
import java.lang.ref.WeakReference
import java.util.*

class ExpoHeadlessAppLoader(private val contextRef: WeakReference<Context>) {
    interface AppRunCallback {
        fun appAlreadyRunning()
        fun appStarted()
        fun appStartError(e: Exception?)
    }
    
    fun runApp(appId: String?, task: TaskInterface, callback: AppRunCallback) {
        val reactInstanceManager = (contextRef.get()?.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
        if (!isReactInstanceRunning(reactInstanceManager)) {
            reactInstanceManager.addReactInstanceEventListener { context: ReactContext? ->
                callback.appStarted()
                reactInstanceManager.packages
            }
            reactInstanceManager.createReactContextInBackground()
        } else {
            callback.appAlreadyRunning()
        }
    }

    private fun isReactInstanceRunning(reactInstanceManager: ReactInstanceManager): Boolean {
        return reactInstanceManager.hasStartedCreatingInitialContext()
    }

    fun invalidate(appId: String) {
        val appRecord: AppRecordInterface? = appRecords[appId]

        if (appRecord != null) {
            appRecord.invalidate()
            appRecords.remove(appId)
        }}

    companion object {
        // { "<appId>": AppRecordInterface }
        private val appRecords: MutableMap<String, AppRecordInterface> = HashMap()
    }
}