package expo.modules.linking

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class LinkingReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
    onReceiveURL(activity?.intent?.data)
  }

  override fun onNewIntent(intent: Intent?): Boolean {
    onReceiveURL(intent?.data)
    return true
  }

  private fun onReceiveURL(url: Uri?) {
    if (url == null) {
      return
    }
    ExpoLinkingModule.initialURL = url
    ExpoLinkingModule.onURLReceivedObservers.forEach { it -> it(url) }
  }
}
