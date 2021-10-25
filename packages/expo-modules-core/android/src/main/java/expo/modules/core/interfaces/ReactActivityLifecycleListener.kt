package expo.modules.core.interfaces

import android.app.Activity
import android.os.Bundle
import com.facebook.react.ReactRootView

interface ReactActivityLifecycleListener {
  fun onCreate(activity: Activity, savedInstanceState: Bundle?) {}
  fun onResume(activity: Activity) {}
  fun onPause(activity: Activity) {}
  fun onDestroy(activity: Activity) {}
  fun createReactRootView(activity: Activity): ReactRootView? {
    return null
  }
}
