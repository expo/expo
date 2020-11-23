package expo.modules.developmentclient

import android.app.Application
import android.content.Context
import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import expo.modules.developmentclient.launcher.DevelopmentClientActivity
import expo.modules.developmentclient.launcher.DevelopmentClientHost
import expo.modules.developmentclient.launcher.DevelopmentClientLifecycle
import expo.modules.developmentclient.launcher.ReactActivityDelegateSupplier
import expo.modules.developmentclient.launcher.loaders.DevelopmentClientExpoAppLoader
import expo.modules.developmentclient.launcher.loaders.DevelopmentClientReactNativeAppLoader
import expo.modules.developmentclient.launcher.manifest.DevelopmentClientManifestParser
import expo.modules.developmentclient.react.DevelopmentClientReactActivityRedirectDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient

// Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK

class DevelopmentClientController private constructor(
  private val mContext: Context,
  private val mAppHost: ReactNativeHost
) {
  val devClientHost = DevelopmentClientHost((mContext as Application), DEV_LAUNCHER_HOST)
  private val httpClient = OkHttpClient()
  private val lifecycle = DevelopmentClientLifecycle()

  enum class Mode {
    LAUNCHER, APP
  }

  var mode = Mode.LAUNCHER

  suspend fun loadApp(url: String) {
    ensureAppHostWasCleared()

    val parsedUrl = url.replace("exp", "http")
    val manifestParser = DevelopmentClientManifestParser(httpClient, parsedUrl)
    val appIntent = createAppIntent()


    val appLoader = if (!manifestParser.isManifestUrl()) {
      // It's (maybe) a raw React Native bundle
      DevelopmentClientReactNativeAppLoader(url, mAppHost, mContext)
    } else {
      DevelopmentClientExpoAppLoader(manifestParser.parseManifest(), mAppHost, mContext)
    }

    val appLoaderListener = appLoader.createOnDelegateWillBeCreatedListener()
    lifecycle.addListener(appLoaderListener)
    mode = Mode.APP

    // Note that `launch` method is a suspend one. So the execution will be stopped here until the method doesn't finish.
    if (appLoader.launch(appIntent)) {
      // Here the app will be loaded - we can remove listener here.
      lifecycle.removeListener(appLoaderListener)
    } else {
      // The app couldn't be loaded. For now, we just return to the launcher.
      mode = Mode.LAUNCHER
    }
  }

  fun navigateToLauncher() {
    ensureAppHostWasCleared()

    mode = Mode.LAUNCHER
    mContext.applicationContext.startActivity(createLauncherIntent())
  }

  private fun ensureAppHostWasCleared() {
    if (mAppHost.hasInstance()) {
      runBlocking(Dispatchers.Main) {
        mAppHost.reactInstanceManager.destroy()
      }
    }
  }

  fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplier: ReactActivityDelegateSupplier): ReactActivityDelegate {
    return if (mode == Mode.LAUNCHER) {
      DevelopmentClientReactActivityRedirectDelegate(activity) {
        navigateToLauncher()
      }
    } else {
      delegateSupplier.get()
    }
  }

  private fun createLauncherIntent() =
    Intent(mContext, DevelopmentClientActivity::class.java)
      .apply { addFlags(NEW_ACTIVITY_FLAGS) }

  private fun createAppIntent() =
    if (sLauncherClass == null) {
      checkNotNull(
        mContext
          .packageManager
          .getLaunchIntentForPackage(mContext.packageName)
      ) { "Couldn't find the launcher class." }
    } else {
      Intent(mContext, sLauncherClass!!)
    }.apply { addFlags(NEW_ACTIVITY_FLAGS) }


  companion object {
    private var sInstance: DevelopmentClientController? = null
    private var sLauncherClass: Class<*>? = null

    @JvmStatic
    val instance: DevelopmentClientController
      get() {
        return checkNotNull(sInstance) { "DevelopmentClientController.getInstance() was called before the module was initialized" }
      }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevelopmentClientController(context, appHost)
    }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost, launcherClass: Class<*>) {
      initialize(context, appHost)
      sLauncherClass = launcherClass
    }

    @JvmStatic
    fun wrapReactActivityDelegate(activity: ReactActivity, reactActivityDelegateSupplier: ReactActivityDelegateSupplier): ReactActivityDelegate {
      instance.lifecycle.delegateWillBeCreated(activity)
      return instance.getCurrentReactActivityDelegate(activity, reactActivityDelegateSupplier)
    }
  }
}
