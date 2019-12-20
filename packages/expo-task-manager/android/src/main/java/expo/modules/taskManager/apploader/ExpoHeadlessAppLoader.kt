package expo.modules.taskManager.apploader

import android.content.Context
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

    // TODO[@mczernek]: Make this return non-optional Boolean
    fun runApp(appId: String?, task: TaskInterface, callback: AppRunCallback) {
        if(appRecords.containsKey(appId)) {
            callback.appAlreadyRunning()
        } else {
            val appLoader: AppLoaderInterface? = createAppLoader()
            if (task.appUrl == null) {
                // TODO[@mczernek]: Logging
                callback.appStartError(Exception("Nope!"))
            }
            if (task.appUrl == null) {
                callback.appStartError(Exception("Nope!"))
            }
            appLoader?.also {
                val options: Map<String, Any> = HashMap()

                val appRecord: AppRecordInterface = appLoader.loadApp(task.appUrl, options, object : AppLoaderProvider.Callback() {
                    override fun onComplete(success: Boolean, exception: java.lang.Exception) {
                        if (!success) {
                            exception.printStackTrace()
                            callback.appStartError(IllegalStateException("Unable to load app for some reason"))
                            appRecords.remove(appId)
                        }
                        callback.appStarted()
                    }
                })
                appRecords[appId!!] = appRecord
            }
        }
    }

    private fun createAppLoader(): AppLoaderInterface? { // for now only react-native apps in Expo are supported
        val context: Context? = contextRef.get()
        return context?.let { AppLoaderProvider.createLoader("react-native-experience", context) }
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