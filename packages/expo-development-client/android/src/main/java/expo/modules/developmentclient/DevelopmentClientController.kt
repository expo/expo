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
import expo.modules.developmentclient.react.injectDebugServerHost

class DevelopmentClientController private constructor(private val mContext: Context, private val mAppHost: ReactNativeHost) {
  // Use this to load from a development server for the development client launcher UI
  //  private final String DEV_LAUNCHER_HOST = "10.0.0.175:8090";
  private val DEV_LAUNCHER_HOST: String? = null
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
      val pm = mContext.packageManager
      val appIntent = pm.getLaunchIntentForPackage(mContext.packageName)
      appIntent!!.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
      mContext.applicationContext.startActivity(appIntent)
    }
  }

  fun navigateToLauncher() {
    mode = Mode.LAUNCHER
    val launcherIntent = Intent(mContext, DevelopmentClientActivity::class.java)
    launcherIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
    mContext.applicationContext.startActivity(launcherIntent)
  }

  fun wrapReactActivityDelegate(activity: ReactActivity, delegate: ReactActivityDelegate): ReactActivityDelegate {
    return if (mode == Mode.LAUNCHER) {
      object : ReactActivityDelegate(activity, "BareExpo") {
        override fun onCreate(savedInstanceState: Bundle?) {
          val launcherIntent = Intent(plainActivity, DevelopmentClientActivity::class.java)
          launcherIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
          activity.startActivity(launcherIntent)
          plainActivity.finish()
        }

        override fun onResume() {}
        override fun onPause() {}
        override fun onDestroy() {}
      }
    } else {
      delegate
    }
  }

  companion object {
    private var sInstance: DevelopmentClientController? = null
    @JvmStatic
    val instance: DevelopmentClientController
      get() {
        checkNotNull(sInstance) { "DevelopmentClientController.getInstance() was called before the module was initialized" }
        return sInstance!!
      }

    @JvmStatic
    fun initialize(context: Context, appHost: ReactNativeHost) {
      check(sInstance == null) { "DevelopmentClientController was initialized." }
      sInstance = DevelopmentClientController(context, appHost)
    }
  }
}
