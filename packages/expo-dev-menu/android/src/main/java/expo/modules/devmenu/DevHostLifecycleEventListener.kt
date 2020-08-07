package expo.modules.devmenu

import com.facebook.react.bridge.LifecycleEventListener
import expo.modules.devmenu.managers.DebugBundlerManager

class DevHostLifecycleEventListener(private val bundlerManager: DebugBundlerManager?): LifecycleEventListener {
  override fun onHostResume() = Unit

  override fun onHostPause() = Unit

  override fun onHostDestroy() {
    bundlerManager?.switchBundler()
  }
}
