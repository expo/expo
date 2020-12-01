package expo.modules.developmentclient.react

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity

class DevelopmentClientReactActivityRedirectDelegate(
  activity: ReactActivity,
  private val redirect: (Intent?) -> Unit
) : DevelopmentClientReactActivityNOPDelegate(activity) {

  override fun onCreate(savedInstanceState: Bundle?) {
    redirect(plainActivity.intent)
    plainActivity.finish()
  }
}
