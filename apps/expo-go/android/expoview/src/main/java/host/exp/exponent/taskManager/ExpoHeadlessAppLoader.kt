package host.exp.exponent.taskManager

import android.content.Context
import android.util.Log
import expo.modules.adapters.react.apploader.HeadlessAppLoaderNotifier
import expo.modules.apploader.AppLoaderProvider
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.apploader.HeadlessAppLoader.AppConfigurationError
import expo.modules.core.interfaces.Consumer
import expo.modules.core.interfaces.DoNotStrip
import host.exp.exponent.headless.InternalHeadlessAppLoader
import java.util.*

@DoNotStrip
class ExpoHeadlessAppLoader @DoNotStrip constructor(context: Context?) : HeadlessAppLoader {
  private val appScopeKeysToAppRecords = mutableMapOf<String, AppRecordInterface>()

  @Throws(AppConfigurationError::class)
  override fun loadApp(
    context: Context,
    params: HeadlessAppLoader.Params,
    alreadyRunning: Runnable,
    callback: Consumer<Boolean>
  ) {
    val appLoader = createAppLoader(context)

    if (params.appUrl == null) {
      throw AppConfigurationError("Cannot execute background task because application URL is invalid")
    } else {
      if (appScopeKeysToAppRecords.containsKey(params.appScopeKey)) {
        alreadyRunning.run()
      } else {
        Log.i(
          TAG,
          "Loading headless app '" + params.appScopeKey + "' with url '" + params.appUrl + "'."
        )
        val appRecord = appLoader.loadApp(
          params.appUrl,
          mapOf(),
          object : AppLoaderProvider.Callback() {
            override fun onComplete(success: Boolean, exception: Exception?) {
              if (exception != null) {
                exception.printStackTrace()
                Log.e(TAG, exception.message!!)
              }
              HeadlessAppLoaderNotifier.notifyAppLoaded(params.appScopeKey)
              callback.apply(success)
              if (!success) {
                appScopeKeysToAppRecords.remove(params.appScopeKey)
              }
            }
          }
        )

        appScopeKeysToAppRecords[params.appScopeKey] = appRecord
      }
    }
  }

  override fun invalidateApp(appScopeKey: String): Boolean {
    appScopeKeysToAppRecords.remove(appScopeKey)
    HeadlessAppLoaderNotifier.notifyAppLoaded(appScopeKey)
    return false
  }

  private fun createAppLoader(context: Context): AppLoaderInterface {
    // for now only react-native apps in Expo are supported
    if (appLoader == null) {
      appLoader = InternalHeadlessAppLoader(context)
    }
    return appLoader!!
  }

  override fun isRunning(appScopeKey: String): Boolean {
    return appScopeKeysToAppRecords.containsKey(appScopeKey)
  }

  companion object {
    private const val TAG = "TaskManagerInternalAppL"

    private var appLoader: AppLoaderInterface? = null
  }
}
