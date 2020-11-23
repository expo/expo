package expo.modules.developmentclient.react

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate

class DevelopmentClientReactActivityRedirectDelegate(
  activity: ReactActivity,
  private val redirect: (intent: Intent?) -> Unit
) : ReactActivityDelegate(activity, null) {

  override fun onCreate(savedInstanceState: Bundle?) {
    redirect(plainActivity.intent)
    plainActivity.finish()
  }

  override fun onResume() {}
  override fun onPause() {}
  override fun onDestroy() {}
}
