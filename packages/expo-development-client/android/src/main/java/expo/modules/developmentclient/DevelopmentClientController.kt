package expo.modules.developmentclient

import android.app.Application
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactNativeHost
import expo.modules.developmentclient.launcher.DevelopmentClientActivity
import expo.modules.developmentclient.launcher.DevelopmentClientHost
import expo.modules.developmentclient.launcher.ReactActivityDelegateSupplier
import expo.modules.developmentclient.react.injectDebugServerHost

// Use this to load from a development server for the development client launcher UI
//  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
private val DEV_LAUNCHER_HOST: String? = null

private const val NEW_ACTIVITY_FLAGS = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK

class DevelopmentClientController private constructor(private val mContext: Context, private val mAppHost: ReactNativeHost) {
  val devClientHost = DevelopmentClientHost((mContext as Application), DEV_LAUNCHER_HOST)

  enum class Mode {
    LAUNCHER, APP
  }

  var mode = Mode.LAUNCHER

  fun loadApp(url: String?) {
    val uri = Uri.parse(url)
    val debugServerHost = uri.host + ":" + uri.port
    if (injectDebugServerHost(mContext, mAppHost, debugServerHost)) {
      mode = Mode.APP
      startNewActivity(createAppIntent())
    }
  }

  fun navigateToLauncher() {
    mode = Mode.LAUNCHER
    if (mAppHost.hasInstance()) {
      mAppHost.reactInstanceManager.destroy()
    }
    val launcherIntent = Intent(mContext, DevelopmentClientActivity::class.java)
    launcherIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    mContext.applicationContext.startActivity(launcherIntent)
  }

  fun getCurrentReactActivityDelegate(activity: ReactActivity, delegateSupplier: ReactActivityDelegateSupplier): ReactActivityDelegate {
    return if (mode == Mode.LAUNCHER) {
      object : ReactActivityDelegate(activity, null) {
        override fun onCreate(savedInstanceState: Bundle?) {
          startNewActivity(createLauncherIntent())
          plainActivity.finish()
        }

        override fun onResume() {}
        override fun onPause() {}
        override fun onDestroy() {}
      }
    } else {
      delegateSupplier.get()
    }
  }

  private fun startNewActivity(intent: Intent) {
    mContext.applicationContext.startActivity(intent)
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
      return instance.getCurrentReactActivityDelegate(activity, reactActivityDelegateSupplier)
    }
  }
}
