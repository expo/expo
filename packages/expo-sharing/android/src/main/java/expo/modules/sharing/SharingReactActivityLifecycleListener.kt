package expo.modules.sharing

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import java.lang.ref.WeakReference

class SharingReactActivityLifecycleListener(activityContext: Context) :
  ReactActivityLifecycleListener {

  private val activityContext: WeakReference<ReactActivity> =
    WeakReference(activityContext as? ReactActivity)

  override fun onCreate(activity: Activity?, misavedInstanceState: Bundle?) {
    if (activity?.intent != null && isShareIntent(activity.intent)) {
      SharingSingleton.intent = Intent(activity.intent)

      getShareIntentUri(activity)?.let { uri ->
        // Navigation handlers will ignore the intent data if the action is different than ACTION_VIEW
        // Because of this the app will always open with the default ${scheme}:/// path.
        // We change the action to `Intent.ACTION_VIEW` but store the original Intent in the singleton
        // so that the module can parse the shared data later.
        activity.intent.action = Intent.ACTION_VIEW
        activity.intent.data = uri
      }
    }
  }

  override fun onNewIntent(intent: Intent?): Boolean {
    val reactActivity = activityContext.get() ?: return false
    if (intent != null && isShareIntent(intent)) {
      emitShareIntentReceived(reactActivity, intent)
      return false
    }

    return false
  }
}
