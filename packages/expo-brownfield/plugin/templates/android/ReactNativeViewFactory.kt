package ${{packageId}}

import android.content.Context
import android.os.Bundle
import android.widget.FrameLayout
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView

enum class RootComponent(val key: String) {
  Main("main")
}

object ReactNativeViewFactory {
  fun createFrameLayout(
      context: Context,
      activity: FragmentActivity,
      rootComponent: RootComponent,
      launchOptions: Bundle? = null,
  ): FrameLayout {
    val reactHost = ReactNativeHostManager.shared.getReactHost()
    val reactDelegate = ReactDelegate(activity, reactHost!!, rootComponent.key, launchOptions)

    activity.lifecycle.addObserver(
        object : DefaultLifecycleObserver {
          override fun onResume(owner: LifecycleOwner) {
            reactDelegate.onHostResume()
          }

          override fun onPause(owner: LifecycleOwner) {
            reactDelegate.onHostPause()
          }

          override fun onDestroy(owner: LifecycleOwner) {
            reactDelegate.onHostDestroy()
            owner.lifecycle.removeObserver(this) // Cleanup to avoid leaks
          }
        }
    )

    reactDelegate.loadApp()
    return reactDelegate.reactRootView!!

  }
}
