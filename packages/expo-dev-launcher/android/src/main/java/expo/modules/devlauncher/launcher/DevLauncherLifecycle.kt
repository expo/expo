package expo.modules.devlauncher.launcher

import com.facebook.react.ReactActivity
import java.util.LinkedList

typealias DevLauncherDelegateWillBeCreated = (ReactActivity) -> Unit

/**
 * This class encapsulate all lifecycle methods related to the DevelopmentClient instance and loaded apps.
 */
class DevLauncherLifecycle {
  private val delegateWillBeCreatedListeners = LinkedList<DevLauncherDelegateWillBeCreated>()

  fun delegateWillBeCreated(activity: ReactActivity) {
    delegateWillBeCreatedListeners.forEach {
      it.invoke(activity)
    }
  }

  fun addListener(listener: DevLauncherDelegateWillBeCreated) {
    delegateWillBeCreatedListeners.add(listener)
  }

  fun removeListener(listener: DevLauncherDelegateWillBeCreated) {
    delegateWillBeCreatedListeners.remove(listener)
  }
}
